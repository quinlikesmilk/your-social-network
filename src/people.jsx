import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase.js"
import { normalizeState, normalizeCity } from "./lib/location.js"

function People() {
  const [people, setPeople] = useState([])
  const [currentProfile, setCurrentProfile] = useState(null)
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("mayKnow")
  const [connecting, setConnecting] = useState(null)

  useEffect(() => {
    async function loadPeople() {
      const { data: userData, error: userError } =
        await supabase.auth.getUser()

      if (userError || !userData.user) {
        console.error("User error:", userError)
        setLoading(false)
        return
      }

      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select(
             "id, username, age, school, location, state, bio, hobbies, interests, avatar_url"
          )
          .eq("id", userData.user.id)
          .single()

      if (profileError) {
        console.error("Profile error:", profileError)
        setLoading(false)
        return
      }

      setCurrentProfile(profileData)

      const { data: connectionData, error: connectionError } =
        await supabase
          .from("connections")
          .select("sender_id, receiver_id, status")
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

      const { data: peopleData, error: peopleError } =
        await supabase
          .from("profiles")
          .select(
           "id, username, age, school, location, state, bio, hobbies, interests, avatar_url"
          )
          .neq("id", userData.user.id)

      if (peopleError) {
        console.error("People error:", peopleError)
        setLoading(false)
        return
      }

     const peopleWithAvatars = await Promise.all(
  peopleData.map(async (person) => {
    if (!person.avatar_url) {
      return {
        ...person,
        avatarDisplayUrl: null,
      }
    }

    const { data: avatarData, error: avatarError } =
      await supabase.storage
        .from("profile-images")
        .createSignedUrl(
          person.avatar_url,
          60 * 60
        )

    if (avatarError) {
      console.error(
        "Avatar URL error:",
        avatarError
      )

      return {
        ...person,
        avatarDisplayUrl: null,
      }
    }

    return {
      ...person,
      avatarDisplayUrl: avatarData.signedUrl,
    }
  })
)

setPeople(peopleWithAvatars)
setLoading(false)
    }

    loadPeople()
  }, [])

  function getAgeGroup(age) {
    if (!age) {
      return null
    }

    if (age >= 13 && age <= 15) {
      return "13-15"
    }

    if (age >= 16 && age <= 17) {
      return "16-17"
    }

    if (age >= 18) {
      return "18+"
    }

    return null
  }

  function getFilteredPeople() {
    if (!currentProfile) {
      return []
    }

    const currentAgeGroup = getAgeGroup(currentProfile.age)

    if (!currentAgeGroup) {
      return []
    }

    // Safety filter first.
    const safePeople = people.filter(
      (person) =>
        getAgeGroup(person.age) === currentAgeGroup
    )

    if (filter === "interests") {
      const currentInterests =
        currentProfile.interests || []

      return safePeople.filter((person) => {
        const personInterests =
          person.interests || []

        return personInterests.some((interest) =>
          currentInterests.some(
            (currentInterest) =>
              interest.toLowerCase().trim() ===
              currentInterest.toLowerCase().trim()
          )
        )
      })
    }

    if (filter === "mayKnow") {
      return safePeople.filter((person) => {
        const sameSchool =
          person.school &&
          currentProfile.school &&
          person.school.toLowerCase().trim() ===
            currentProfile.school.toLowerCase().trim()

        const personCity = normalizeCity(person.location)
        const currentCity = normalizeCity(
          currentProfile.location
        )

        const personState = normalizeState(person.state)
        const currentState = normalizeState(
          currentProfile.state
        )

        const sameCommunity =
          personState &&
          currentState &&
          personState === currentState &&
          (
            !personCity ||
            !currentCity ||
            personCity === currentCity
          )

        const sameState =
          personState &&
          currentState &&
          personState === currentState

        return (
          sameSchool ||
          sameCommunity ||
          sameState
        )
      })
    }

    // Everybody = everyone who passed
    // the safety filter.
    return safePeople
  }

  function getConnectionStatus(personId) {
    const connection = connections.find(
      (item) =>
        (item.sender_id === currentProfile?.id &&
          item.receiver_id === personId) ||
        (item.sender_id === personId &&
          item.receiver_id === currentProfile?.id)
    )

    if (!connection) {
      return "none"
    }

    if (connection.status === "accepted") {
      return "connected"
    }

    if (
      connection.status === "pending" &&
      connection.sender_id === currentProfile?.id
    ) {
      return "pending"
    }

    if (
      connection.status === "pending" &&
      connection.receiver_id === currentProfile?.id
    ) {
      return "incoming"
    }

    return "none"
  }

  async function handleConnect(personId) {
    setConnecting(personId)

    const { data: userData, error: userError } =
      await supabase.auth.getUser()

    if (userError || !userData.user) {
      console.error("User error:", userError)
      setConnecting(null)
      return
    }

    const { data, error } = await supabase
      .from("connections")
      .insert({
        sender_id: userData.user.id,
        receiver_id: personId,
        status: "pending",
      })
      .select("sender_id, receiver_id, status")
      .single()

    if (error) {
      console.error("Connection error:", error)
      setConnecting(null)
      return
    }

    setConnections((currentConnections) => [
      ...currentConnections,
      data,
    ])

    setConnecting(null)
  }

  if (loading) {
    return <p>Loading people...</p>
  }

  const filteredPeople = getFilteredPeople()

  return (
    <div>

      <header className="site-header">
        <h1 className="site-title">
          your <span>social network</span>
        </h1>

        <nav>
          <a href="/">Home</a>
          <a href="#">Messages</a>
          <a href="/notifications">Notifications</a>
        </nav>
      </header>

      <main className="home">

        <a href="/" className="back">
          ← back home
        </a>

        <h2>Find people</h2>

        <p>
          Find people you know, or want to know.
        </p>

        <section className="discovery-options">

          <button
            className={`discovery-option ${
              filter === "mayKnow" ? "active" : ""
            }`}
            onClick={() => setFilter("mayKnow")}
          >
            <strong>People You May Know</strong>
            <span>
              People who may be connected to you
              through school or community.
            </span>
          </button>

          <button
            className={`discovery-option ${
              filter === "interests" ? "active" : ""
            }`}
            onClick={() => setFilter("interests")}
          >
            <strong>People Who Share Your Interests</strong>
            <span>
              People who like some of the same
              things you do.
            </span>
          </button>

          <button
            className={`discovery-option ${
              filter === "all" ? "active" : ""
            }`}
            onClick={() => setFilter("all")}
          >
            <strong>Everybody</strong>
            <span>
              Everyone you can currently discover.
            </span>
          </button>

        </section>

        <section className="people-list">

          {filteredPeople.length === 0 ? (

            <p className="no-people">
              No people found yet.
            </p>

          ) : (

            filteredPeople.map((person) => {

              const connectionStatus =
                getConnectionStatus(person.id)

              return (
                <article
                  className="person"
                  key={person.id}
                >

              <div className="person-picture">
  {person.avatarDisplayUrl && (
    <img
      src={person.avatarDisplayUrl}
      alt={`${person.username}'s profile`}
    />
  )}
</div>

                  <div className="person-info">

                    <h3>
                      <a
                        href={`/profile/${person.username}`}
                      >
                        {person.username}
                      </a>
                    </h3>

                    <p>
                      {person.hobbies ||
                        person.bio ||
                        "No information yet."}
                    </p>

                  </div>

                  {connectionStatus === "none" && (
                    <button
                      className="connect"
                      onClick={() =>
                        handleConnect(person.id)
                      }
                      disabled={
                        connecting === person.id
                      }
                    >
                      {connecting === person.id
                        ? "Connecting..."
                        : "Connect"}
                    </button>
                  )}

                  {connectionStatus === "pending" && (
                    <button
                      className="connect"
                      disabled
                    >
                      Pending
                    </button>
                  )}

                  {connectionStatus === "incoming" && (
                    <a
                      href="/notifications"
                      className="connect"
                    >
                      Accept request
                    </a>
                  )}

                  {connectionStatus === "connected" && (
                    <button
                      className="connect"
                      disabled
                    >
                      Connected ✓
                    </button>
                  )}

                </article>
              )
            })

          )}

        </section>

      </main>

    </div>
  )
}

export default People