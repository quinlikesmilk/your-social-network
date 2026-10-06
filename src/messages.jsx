import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase.js"

function Messages() {
  const [user, setUser] = useState(null)
  const [connections, setConnections] = useState([])
  const [profiles, setProfiles] = useState([])
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMessages() {
      const { data: userData, error: userError } =
        await supabase.auth.getUser()

      if (userError || !userData.user) {
        console.error("User error:", userError)
        setLoading(false)
        return
      }

      setUser(userData.user)

      const { data: connectionData, error: connectionError } =
        await supabase
          .from("connections")
          .select("sender_id, receiver_id")
          .eq("status", "accepted")
          .or(
            `sender_id.eq.${userData.user.id},receiver_id.eq.${userData.user.id}`
          )

      if (connectionError) {
        console.error(
          "Connections error:",
          connectionError
        )
        setLoading(false)
        return
      }

      setConnections(connectionData)

      const connectedIds = connectionData.map((connection) =>
        connection.sender_id === userData.user.id
          ? connection.receiver_id
          : connection.sender_id
      )

      if (connectedIds.length === 0) {
        setProfiles([])
        setLoading(false)
        return
      }

      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", connectedIds)

      if (profileError) {
        console.error(
          "Profiles error:",
          profileError
        )
        setLoading(false)
        return
      }

      const profilesWithAvatars = await Promise.all(
        profileData.map(async (profile) => {
          if (!profile.avatar_url) {
            return {
              ...profile,
              avatarDisplayUrl: null,
            }
          }

          const { data: avatarData, error: avatarError } =
            await supabase.storage
              .from("profile-images")
              .createSignedUrl(
                profile.avatar_url,
                60 * 60
              )

          if (avatarError) {
            console.error(
              "Avatar URL error:",
              avatarError
            )

            return {
              ...profile,
              avatarDisplayUrl: null,
            }
          }

          return {
            ...profile,
            avatarDisplayUrl: avatarData.signedUrl,
          }
        })
      )

      setProfiles(profilesWithAvatars)
      setLoading(false)
    }

    loadMessages()
  }, [])

  async function openConversation(person) {
    setSelectedPerson(person)

    if (!user) {
      return
    }

    const { data, error } = await supabase
      .from("messages")
      .select("id, sender_id, receiver_id, content, created_at")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${person.id}),and(sender_id.eq.${person.id},receiver_id.eq.${user.id})`
      )
      .order("created_at", {
        ascending: true,
      })

    if (error) {
      console.error(
        "Messages error:",
        error
      )
      return
    }

    setMessages(data)
  }

  async function handleSend(event) {
    event.preventDefault()

    const content = newMessage.trim()

    if (!content || !selectedPerson || !user) {
      return
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        receiver_id: selectedPerson.id,
        content,
      })
      .select(
        "id, sender_id, receiver_id, content, created_at"
      )
      .single()

    if (error) {
      console.error(
        "Send message error:",
        error
      )
      return
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      data,
    ])

    setNewMessage("")
  }

  if (loading) {
    return <p>Loading messages...</p>
  }

  if (selectedPerson) {
    return (
      <div>
        <header className="site-header">
          <h1 className="site-title">
            your <span>social network</span>
          </h1>

          <nav>
            <a href="/">Home</a>
            <a href="/people">People</a>
            <a href="/notifications">
              Notifications
            </a>
          </nav>
        </header>

        <main className="home">

          <button
            className="back"
            onClick={() =>
              setSelectedPerson(null)
            }
          >
            ← back to messages
          </button>

          <h2>
            {selectedPerson.username}
          </h2>

          <section className="message-list">

            {messages.length === 0 ? (
              <p className="no-people">
                No messages yet. Say hello!
              </p>
            ) : (
              messages.map((message) => (
                <div
                  className={
                    message.sender_id === user.id
                      ? "message sent"
                      : "message received"
                  }
                  key={message.id}
                >
                  {message.content}
                </div>
              ))
            )}

          </section>

          <form
            className="message-form"
            onSubmit={handleSend}
          >
            <input
              type="text"
              value={newMessage}
              onChange={(event) =>
                setNewMessage(
                  event.target.value
                )
              }
              placeholder="Type a message..."
            />

            <button type="submit">
              Send
            </button>
          </form>

        </main>
      </div>
    )
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
          <a href="/notifications">
            Notifications
          </a>
        </nav>
      </header>

      <main className="home">

        <a href="/" className="back">
          ← back home
        </a>

        <h2>Messages</h2>

        {profiles.length === 0 ? (
          <p className="no-people">
            You don't have any connections yet.
          </p>
        ) : (
          <section className="message-people">

            {profiles.map((profile) => (
              <button
                className="message-person"
                key={profile.id}
                onClick={() =>
                  openConversation(profile)
                }
              >

                <div className="message-person-picture">
                  {profile.avatarDisplayUrl && (
                    <img
                      src={
                        profile.avatarDisplayUrl
                      }
                      alt=""
                    />
                  )}
                </div>

                <strong>
                  {profile.username}
                </strong>

              </button>
            ))}

          </section>
        )}

      </main>
    </div>
  )
}

export default Messages