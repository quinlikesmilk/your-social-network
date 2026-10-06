import { useState } from "react"
import { supabase } from "./lib/supabase"

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  async function handleLogin(event) {
    event.preventDefault()

    setMessage("Logging you in...")

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      return
    }

    window.location.href = "/"
  }

  return (
    <main className="auth-page">

      <h2>Log in</h2>

      <p>
        Welcome back to your social network.
      </p>

      <form onSubmit={handleLogin}>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <button type="submit">
          Log in
        </button>

      </form>

      {message && <p>{message}</p>}

    </main>
  )
}

export default Login