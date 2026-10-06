import Notifications from "./notifications"
import Profile from "./profile"
import { useEffect, useState } from "react"
import People from "./people"
import EditProfile from "./edit-profile"
import Signup from "./signup"
import Login from "./login"
import { supabase } from "./lib/supabase"
import Messages from "./messages"

function App() {
    console.log("Supabase:", supabase)

      const path = window.location.pathname

      const [user, setUser] = useState(null)

      const [profile, setProfile] = useState(null)

useEffect(() => {
  async function loadUser() {
    const { data: userData } = await supabase.auth.getUser()

    setUser(userData.user)

    if (userData.user) {
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("username, bio")
        .eq("id", userData.user.id)
        .single()

      if (error) {
        console.error("Profile error:", error)
        return
      }

      setProfile(profileData)
    }
  }

  loadUser()
}, [])


if (path === "/login") {
  return <Login />
}

if (path === "/notifications") {
  return <Notifications />
}

if (path === "/messages") {
  return <Messages />
}

  if (path === "/signup") {
  return <Signup />
}

if (path === "/profile" || path.startsWith("/profile/")) {
  return <Profile />
}

if (path === "/edit-profile") {
  return <EditProfile />
}

  if (path === "/people") {
    return <People />
  }

  return (
    <div>
      <header className="site-header">
        <h1 className="site-title">
          your <span>social network</span>
        </h1>

        <nav>
          <a href="/">Home</a>
       <a href="/messages">Messages</a>
        <a href="/notifications">Notifications</a>
        </nav>
      </header>

      <main className="home">

        <section className="welcome">
      <h2>
  {profile
    ? `Welcome back, ${profile.username}.`
    : "Welcome to your social network."}
</h2>

          <p>
            Find people you know, want to know,
            and connect! :)
          </p>
        </section>

        <section className="options">
          <a href="/people" className="option">
            Connect with people
          </a>

       <a href="/profile" className="option">
  Your profile
</a>

          <a href="/edit-profile" className="option">
            Customize your space
          </a>
        </section>

        <p className="coming-soon">
          More features coming soon, or not.
        </p>

      </main>
    </div>
  )
}

export default App