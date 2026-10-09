import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase.js"

function Profile() {
  const [profile, setProfile] = useState(null)
  const [connectionCount, setConnectionCount] = useState(0)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [bannerUrl, setBannerUrl] = useState(null)
  const [backgroundImageUrl, setBackgroundImageUrl] =
    useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      try {
        const pathParts =
          window.location.pathname.split("/")

        const username = pathParts[2]
          ? decodeURIComponent(pathParts[2])
          : null

        let query = supabase
          .from("profiles")
          .select(
            "id, username, age, school, location, state, bio, hobbies, interests, avatar_url, banner_url, profile_background_type, profile_background_value, profile_background_secondary, profile_background_image_url"
          )

        if (username) {
          query = query
            .eq("username", username)
            .single()
        } else {
          const { data: userData } =
            await supabase.auth.getUser()

          if (!userData.user) {
            setLoading(false)
            return
          }

          query = query
            .eq("id", userData.user.id)
            .single()
        }

        const { data: profileData, error } =
          await query

        if (error) {
          console.error("Profile error:", error)
          setLoading(false)
          return
        }

        setProfile(profileData)

        async function getImageUrl(path, label) {
          if (!path) return null

          const { data, error } =
            await supabase.storage
              .from("profile-images")
              .createSignedUrl(path, 60 * 60)

          if (error) {
            console.error(`${label} URL error:`, error)
            return null
          }

          return data.signedUrl
        }

        const [avatar, banner, background] =
          await Promise.all([
            getImageUrl(
              profileData.avatar_url,
              "Avatar"
            ),
            getImageUrl(
              profileData.banner_url,
              "Banner"
            ),
            getImageUrl(
              profileData.profile_background_image_url,
              "Background"
            ),
          ])

        setAvatarUrl(avatar)
        setBannerUrl(banner)
        setBackgroundImageUrl(background)

        const {
          count: connectionCountData,
          error: connectionError,
        } = await supabase
          .from("connections")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("status", "accepted")
          .or(
            `sender_id.eq.${profileData.id},receiver_id.eq.${profileData.id}`
          )

        if (connectionError) {
          console.error(
            "Connections error:",
            connectionError
          )
        } else {
          setConnectionCount(
            connectionCountData || 0
          )
        }
      } catch (error) {
        console.error("Could not load profile:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  if (loading) {
    return <p>Loading profile...</p>
  }

  if (!profile) {
    return <p>Profile not found.</p>
  }

  const pathParts = window.location.pathname.split("/")
  const viewingOtherProfile = Boolean(pathParts[2])

  const backgroundType =
    profile.profile_background_type || "color"

  const backgroundValue =
    profile.profile_background_value || "#ffffff"

  let backgroundStyle = {
    backgroundColor: "#ffffff",
  }

  if (backgroundType === "color") {
    backgroundStyle = {
      backgroundColor: backgroundValue,
    }
  }

  if (backgroundType === "gradient") {
    const secondColor =
      profile.profile_background_secondary || "#1aab65"

    backgroundStyle = {
      background: `linear-gradient(135deg, ${backgroundValue}, ${secondColor})`,
    }
  }

  if (
    backgroundType === "image" &&
    backgroundImageUrl
  ) {
    backgroundStyle = {
      backgroundColor: "#ffffff",
      backgroundImage: `url("${backgroundImageUrl}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundAttachment: "fixed",
    }
  }

  return (
    <div
      style={{
        ...backgroundStyle,
        minHeight: "100vh",
        backgroundColor:
          backgroundStyle.backgroundColor || undefined,
      }}
    >
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
        <a href="/" className="back">
          ← back to home
        </a>

        <div className="profile-header">
          {bannerUrl && (
            <img
              src={bannerUrl}
              alt=""
              className="profile-banner"
            />
          )}

          {avatarUrl && (
            <img
              src={avatarUrl}
              alt={`${profile.username}'s profile`}
              className="profile-picture"
            />
          )}
        </div>

        <h2>
          {profile.username}
          {viewingOtherProfile && "!!"}
        </h2>

        {!viewingOtherProfile && (
          <>
            <p>
              {profile.age
                ? `${profile.age} years old`
                : "Age not set"}
            </p>

            <p>
              {profile.school || "School not set"}
            </p>

            <p>
              {profile.location && profile.state
                ? `${profile.location}, ${profile.state}`
                : profile.location ||
                  profile.state ||
                  "Location not set"}
            </p>
          </>
        )}

        <section className="profile-info">
          <h3>About</h3>
          <p>{profile.bio || "No bio yet."}</p>
        </section>

        <section className="profile-info">
          <h3>Hobbies</h3>
          <p>
            {profile.hobbies ||
              "No hobbies listed yet."}
          </p>
        </section>

        <section className="profile-info">
          <h3>Interests</h3>

          {profile.interests?.length > 0 ? (
            <p>
              {profile.interests.join(" · ")}
            </p>
          ) : (
            <p>No interests listed yet.</p>
          )}
        </section>

        <p>
          {connectionCount}{" "}
          {connectionCount === 1
            ? "connection"
            : "connections"}
        </p>

        {!viewingOtherProfile && (
          <a
            href="/edit-profile"
            className="edit-profile"
          >
            Edit profile
          </a>
        )}
      </main>
    </div>
  )
}

export default Profile