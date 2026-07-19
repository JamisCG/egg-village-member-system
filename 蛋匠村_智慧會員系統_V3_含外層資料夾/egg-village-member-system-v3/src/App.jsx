import React, { useEffect, useMemo, useState } from 'react'

const LIFF_ID = '2010756755-A26rfpUz'

const initialForm = {
  fullName: '',
  phone: '',
  email: '',
  birthday: '',
  city: '',
  customerType: '',
  purchaseFrequency: '',
  favoriteProducts: [],
  privacyConsent: false,
  marketingConsent: false
}

export default function App() {
  const [profile, setProfile] = useState(null)
  const [idToken, setIdToken] = useState('')
  const [status, setStatus] = useState('正在連接 LINE…')
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function init() {
      try {
        await window.liff.init({ liffId: LIFF_ID })
        if (!window.liff.isLoggedIn()) {
          window.liff.login({ redirectUri: window.location.href })
          return
        }
        const p = await window.liff.getProfile()
        setProfile(p)
        setIdToken(window.liff.getIDToken() || '')
        setStatus(window.liff.isInClient() ? '已在 LINE 中開啟' : '目前由外部瀏覽器開啟')
        track('liff_open')
      } catch (error) {
        console.error(error)
        setStatus('LINE 連線失敗，請檢查 Endpoint URL 與 LIFF Scope')
      }
    }
    init()
  }, [])

  async function track(eventName, eventValue = '') {
    try {
      await fetch('/api/event', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          idToken,
          eventName,
          eventValue,
          source: new URLSearchParams(location.search).get('source') || 'liff'
        })
      })
    } catch {}
  }

  function updateField(name, value) {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function toggleFavorite(value) {
    setForm(prev => ({
      ...prev,
      favoriteProducts: prev.favoriteProducts.includes(value)
        ? prev.favoriteProducts.filter(x => x !== value)
        : [...prev.favoriteProducts, value]
    }))
  }

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/member', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          idToken,
          displayName: profile?.displayName || '',
          pictureUrl: profile?.pictureUrl || '',
          source: new URLSearchParams(location.search).get('source') || 'liff'
        })
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.errors?.join('、') || result.message || '儲存失敗')
      }

      setMessage('🎉 會員資料已完成！')
      if (window.liff.isInClient()) {
        await window.liff.sendMessages([{ type: 'text', text: '完成問卷' }])
        setTimeout(() => window.liff.closeWindow(), 1000)
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  const ready = Boolean(idToken)

  return (
    <main className="page">
      <header className="hero">
        <div className="logo">🥚</div>
        <div className="eyebrow">EGG MASTER VILLAGE</div>
        <h1>蛋匠村智慧會員中心</h1>
        <p>安心・創新・營養・美味</p>
      </header>

      <section className="card profile">
        {profile?.pictureUrl ? <img src={profile.pictureUrl} alt="" /> : <div className="avatar">👤</div>}
        <div>
          <h2>{profile ? `${profile.displayName}，您好！` : '正在辨識會員…'}</h2>
          <p>{status}</p>
        </div>
      </section>

      <section className="quick-grid">
        {[
          ['🛒', '我要購物', 'shop_click'],
          ['🎁', '優惠專區', 'coupon_click'],
          ['⭐', '我的集點', 'points_click'],
          ['📖', '蛋知識', 'knowledge_click'],
        ].map(([icon, label, event]) => (
          <button key={label} onClick={() => { track(event); alert('此功能已預留，後續可繼續串接。') }}>
            <b>{icon}</b><span>{label}</span>
          </button>
        ))}
      </section>

      <section className="card">
        <div className="section-head">
          <div>
            <div className="eyebrow">VILLAGER PROFILE</div>
            <h2>建立村民資料</h2>
          </div>
          <span className="pill">約 1 分鐘</span>
        </div>

        <form onSubmit={submit}>
          <label>姓名*
            <input value={form.fullName} onChange={e => updateField('fullName', e.target.value)} required />
          </label>

          <label>手機號碼*
            <input value={form.phone} onChange={e => updateField('phone', e.target.value)} required placeholder="0912345678" />
          </label>

          <label>Email
            <input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} />
          </label>

          <div className="two-cols">
            <label>生日
              <input type="date" value={form.birthday} onChange={e => updateField('birthday', e.target.value)} />
            </label>
            <label>所在縣市
              <select value={form.city} onChange={e => updateField('city', e.target.value)}>
                <option value="">請選擇</option>
                {['高雄市','台南市','屏東縣','嘉義市','嘉義縣','台中市','彰化縣','雲林縣','桃園市','新北市','臺北市','其他'].map(x => <option key={x}>{x}</option>)}
              </select>
            </label>
          </div>

          <fieldset>
            <legend>會員類型*</legend>
            <div className="choices">
              {['家庭消費者','餐飲店家','團購主','健身族'].map(x => (
                <label className="choice" key={x}>
                  <input type="radio" name="customerType" value={x} checked={form.customerType === x} onChange={e => updateField('customerType', e.target.value)} required />
                  <span>{x}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>感興趣的商品</legend>
            <div className="choices">
              {['溏心蛋','茶葉蛋','家庭組','商用箱購'].map(x => (
                <label className="choice" key={x}>
                  <input type="checkbox" checked={form.favoriteProducts.includes(x)} onChange={() => toggleFavorite(x)} />
                  <span>{x}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label>預計購買頻率
            <select value={form.purchaseFrequency} onChange={e => updateField('purchaseFrequency', e.target.value)}>
              <option value="">請選擇</option>
              {['每週','每月 2–3 次','每月 1 次','偶爾購買','商用固定採購'].map(x => <option key={x}>{x}</option>)}
            </select>
          </label>

          <label className="consent">
            <input type="checkbox" checked={form.privacyConsent} onChange={e => updateField('privacyConsent', e.target.checked)} required />
            <span>我同意蛋匠村為會員服務、訂單聯繫及優惠管理目的蒐集與使用上述資料。*</span>
          </label>

          <label className="consent">
            <input type="checkbox" checked={form.marketingConsent} onChange={e => updateField('marketingConsent', e.target.checked)} />
            <span>我願意收到新品、試吃活動與會員優惠通知。</span>
          </label>

          <button className="submit" disabled={!ready || saving}>
            {saving ? '正在儲存…' : '儲存會員資料'}
          </button>
          <p className="message">{message}</p>
        </form>
      </section>

      <footer>© 蛋匠村・智慧會員系統 V3</footer>
    </main>
  )
}
