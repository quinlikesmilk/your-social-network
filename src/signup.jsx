import { useState } from "react"
import { supabase } from "./lib/supabase"

function Signup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  async function handleSignup(event) {
    event.preventDefault()

    setMessage("Creating your account...")

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage("Account created! Check your email to confirm it.")
  }

  return (
    <main className="auth-page">

      <h2>Create your account</h2>

      <p>
        Join your social network.
      </p>

      <form onSubmit={handleSignup}>

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
          Create account
        </button>

      </form>

      {message && <p>{message}</p>}

    </main>
  )
}

export default Signup