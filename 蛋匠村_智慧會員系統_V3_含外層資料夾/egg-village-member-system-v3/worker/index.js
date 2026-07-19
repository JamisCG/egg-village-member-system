const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json;charset=utf-8','cache-control':'no-store'}})

async function verifyLine(idToken, channelId){
  if(!idToken||!channelId) throw new Error('缺少 LINE 驗證資料')
  const body=new URLSearchParams({id_token:idToken,client_id:channelId})
  const r=await fetch('https://api.line.me/oauth2/v2.1/verify',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body})
  const d=await r.json()
  if(!r.ok||!d.sub) throw new Error(d.error_description||'LINE 驗證失敗')
  return d
}

export default {
  async fetch(request,env){
    const url=new URL(request.url)
    try{
      if(url.pathname==='/api/health') return reply({ok:true,database:Boolean(env.DB)})

      if(url.pathname==='/api/member'&&request.method==='POST'){
        if(!env.DB) return reply({ok:false,message:'D1 尚未設定，請依 README 完成設定。'},503)
        const input=await request.json()
        const errors=[]
        if(!input.fullName?.trim()) errors.push('請填寫姓名')
        if(!/^09\d{8}$/.test((input.phone||'').replace(/\s|-/g,''))) errors.push('手機格式錯誤')
        if(!input.customerType) errors.push('請選擇會員類型')
        if(!input.privacyConsent) errors.push('請同意個資蒐集')
        if(errors.length) return reply({ok:false,errors},400)

        const p=await verifyLine(input.idToken,env.LINE_LOGIN_CHANNEL_ID)
        await env.DB.prepare(`INSERT INTO members
        (line_user_id,display_name,picture_url,full_name,phone,email,birthday,city,customer_type,favorite_products,purchase_frequency,source,marketing_consent,privacy_consent,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))
        ON CONFLICT(line_user_id) DO UPDATE SET
        display_name=excluded.display_name,picture_url=excluded.picture_url,full_name=excluded.full_name,phone=excluded.phone,email=excluded.email,birthday=excluded.birthday,city=excluded.city,customer_type=excluded.customer_type,favorite_products=excluded.favorite_products,purchase_frequency=excluded.purchase_frequency,source=excluded.source,marketing_consent=excluded.marketing_consent,privacy_consent=excluded.privacy_consent,updated_at=datetime('now')`)
        .bind(p.sub,p.name||'',p.picture||'',input.fullName.trim(),input.phone.replace(/\s|-/g,''),input.email||'',input.birthday||'',input.city||'',input.customerType,JSON.stringify(input.favoriteProducts||[]),input.purchaseFrequency||'',input.source||'liff',input.marketingConsent?1:0,input.privacyConsent?1:0).run()
        return reply({ok:true})
      }

      if(url.pathname==='/api/event'&&request.method==='POST'){
        if(!env.DB) return reply({ok:false},503)
        const input=await request.json()
        let uid=null
        if(input.idToken){const p=await verifyLine(input.idToken,env.LINE_LOGIN_CHANNEL_ID);uid=p.sub}
        await env.DB.prepare('INSERT INTO events(line_user_id,event_name,event_value,source) VALUES(?,?,?,?)')
          .bind(uid,input.eventName||'unknown',input.eventValue||'',input.source||'liff').run()
        return reply({ok:true})
      }

      return env.ASSETS.fetch(request)
    }catch(e){
      console.error(e)
      return reply({ok:false,message:e.message||'系統錯誤'},500)
    }
  }
}
