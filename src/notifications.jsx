import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase.js"

function Notifications() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadNotifications() {
      const { data: userData, error: userError } =
        await supabase.auth.getUser()

      if (userError || !userData.user) {
        console.error("User error:", userError)
        setLoading(false)
        return
      }

      const { data: connectionData, error: connectionError } =
  await supabase
    .from("connections")
    .select("id, sender_id, status, created_at")
    .eq("receiver_id", userData.user.id)
    .eq("status", "pending")

if (connectionError) {
  console.error(
    "Notifications error:",
    connectionError
  )
  setLoading(false)
  return
}

const senderIds = connectionData.map(
  (request) => request.sender_id
)

if (senderIds.length === 0) {
  setRequests([])
  setLoading(false)
  return
}

const { data: profilesData, error: profilesError } =
  await supabase
    .from("profiles")
    .select("id, username")
    .in("id", senderIds)

if (profilesError) {
  console.error(
    "Profile error:",
    profilesError
  )
  setLoading(false)
  return
}

const requestsWithProfiles = connectionData.map(
  (request) => ({
    ...request,
    profile: profilesData.find(
      (profile) =>
        profile.id === request.sender_id
    ),
  })
)

setRequests(requestsWithProfiles)
setLoading(false)

      if (error) {
        console.error("Notifications error:", error)
        setLoading(false)
        return
      }

      setRequests(data)
      setLoading(false)
    }

    loadNotifications()
  }, [])

  async function handleResponse(requestId, newStatus) {
    const { error } = await supabase
      .from("connections")
      .update({
        status: newStatus,
      })
      .eq("id", requestId)

    if (error) {
      console.error("Response error:", error)
      return
    }

    setRequests((currentRequests) =>
      currentRequests.filter(
        (request) => request.id !== requestId
      )
    )
  }

  if (loading) {
    return <p>Loading notifications...</p>
  }

  return (
    <div>
      <header className="site-header">
        <h1 className="site-title">
          your <span>social network</span>
        </h1>

        <nav>
          <a href="/">Home</a>
          <a href="/people">People</a>
          <a href="/notifications">Notifications</a>
        </nav>
      </header>

      <main className="home">
        <a href="/" className="back">
          ← back home
        </a>

        <h2>Notifications</h2>

        {requests.length === 0 ? (
          <p className="no-people">
            No new notifications.
          </p>
        ) : (
          <section className="people-list">
            {requests.map((request) => (
              <article
                className="person"
                key={request.id}
              >
                <div className="person-info">
                  <h3>
  {request.profile?.username || "Someone"}
</h3>

<p>
  wants to connect with you.
</p>
                </div>

                <div className="request-actions">
                  <button
                    onClick={() =>
                      handleResponse(
                        request.id,
                        "accepted"
                      )
                    }
                  >
                    Accept
                  </button>

                  <button
                    onClick={() =>
                      handleResponse(
                        request.id,
                        "declined"
                      )
                    }
                  >
                    Decline
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}

export default Notifications