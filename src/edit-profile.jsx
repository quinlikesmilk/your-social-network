import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase.js"

function EditProfile() {
  const [username, setUsername] = useState("")
  const [age, setAge] = useState("")
  const [school, setSchool] = useState("")
  const [location, setLocation] = useState("")
  const [state, setState] = useState("")
  const [bio, setBio] = useState("")
  const [hobbies, setHobbies] = useState("")
  const [interests, setInterests] = useState("")
  const [message, setMessage] = useState("")
  const [avatarFile, setAvatarFile] = useState(null)
const [bannerFile, setBannerFile] = useState(null)

  useEffect(() => {
    async function loadProfile() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        return
      }



      const { data: profileData, error } = await supabase
        .from("profiles")

        .select(
          "username, age, school, location, state, bio, hobbies, interests"
        )
        .eq("id", userData.user.id)
        .single()



      if (error) {
        console.error("Profile error:", error)
        return
      }

      setUsername(profileData.username || "")
      setAge(profileData.age || "")
      setSchool(profileData.school || "")
      setLocation(profileData.location || "")
      setState(profileData.state || "")
      setBio(profileData.bio || "")
      setHobbies(profileData.hobbies || "")
      setInterests((profileData.interests || []).join(", "))
    }

    loadProfile()
  }, [])

  async function handleSave(event) {
    event.preventDefault()

    setMessage("Saving...")

    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      setMessage("You are not logged in.")
      return
    }

    const interestList = interests
      .split(",")
      .map((interest) => interest.trim())
      .filter((interest) => interest !== "")

      const maxFileSize = 5 * 1024 * 1024

if (avatarFile) {
  if (!avatarFile.type.startsWith("image/")) {
    setMessage("Profile picture must be an image.")
    return
  }

  if (avatarFile.size > maxFileSize) {
    setMessage("Profile picture must be smaller than 5 MB.")
    return
  }
}

if (bannerFile) {
  if (!bannerFile.type.startsWith("image/")) {
    setMessage("Banner image must be an image.")
    return
  }

  if (bannerFile.size > maxFileSize) {
    setMessage("Banner image must be smaller than 5 MB.")
    return
  }
}

      const userId = userData.user.id

let avatarUrl = null
let bannerUrl = null

if (avatarFile) {
  const avatarPath = `${userId}/avatar-${Date.now()}-${avatarFile.name}`

  const { error: avatarError } =
    await supabase.storage
      .from("profile-images")
      .upload(avatarPath, avatarFile, {
        upsert: false,
      })

  if (avatarError) {
    console.error("Avatar upload error:", avatarError)
    setMessage("Could not upload profile picture.")
    return
  }

  avatarUrl = avatarPath
}

if (bannerFile) {
  const bannerPath = `${userId}/banner-${Date.now()}-${bannerFile.name}`

  const { error: bannerError } =
    await supabase.storage
      .from("profile-images")
      .upload(bannerPath, bannerFile, {
        upsert: false,
      })

  if (bannerError) {
    console.error("Banner upload error:", bannerError)
    setMessage("Could not upload banner image.")
    return
  }

  bannerUrl = bannerPath
}

    const { error } = await supabase
      .from("profiles")
      .update({
  username,
  age: age ? Number(age) : null,
  school,
  location,
  state,
  bio,
  hobbies,
  interests: interestList,
  ...(avatarUrl && {
    avatar_url: avatarUrl,
  }),
  ...(bannerUrl && {
    banner_url: bannerUrl,
  }),
})
      .eq("id", userData.user.id)

    if (error) {
      console.error("Save error:", error)
      setMessage(error.message)
      return
    }

    setMessage("Profile saved!")
  }

  return (
    <div>

      <header className="site-header">
        <h1 className="site-title">
          your <span>social network</span>
        </h1>

        <nav>
          <a href="/">Home</a>
          <a href="#">Messages</a>
          <a href="#">Notifications</a>
        </nav>
      </header>

      <main className="home">

        <a href="/home" className="back">
          ← back to home
        </a>

        <h2>Edit your profile</h2>

        <form className="profile-form" onSubmit={handleSave}>

<div>
  <label>
    Profile picture
    <input
      type="file"
      accept="image/*"
      onChange={(event) =>
        setAvatarFile(event.target.files[0])
      }
    />
  </label>

  <label>
    Banner image
    <input
      type="file"
      accept="image/*"
      onChange={(event) =>
        setBannerFile(event.target.files[0])
      }
    />
  </label>
</div>

          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>

          <label>
            Age
            <input
              type="number"
              value={age}
              onChange={(event) => setAge(event.target.value)}
              min="13"
              max="19"
            />
          </label>

          <label>
            School
            <input
              type="text"
              value={school}
              onChange={(event) => setSchool(event.target.value)}
              placeholder="Your school"
            />
          </label>

          <label>
            Community / City
            <input
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Your city or community"
            />
          </label>

          <label>
            State
            <input
              type="text"
              value={state}
              onChange={(event) => setState(event.target.value)}
              placeholder="Your state"
            />
          </label>

          <label>
            Bio
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Tell people a little about yourself"
              rows="4"
            />
          </label>

          <label>
            Hobbies
            <textarea
              value={hobbies}
              onChange={(event) => setHobbies(event.target.value)}
              placeholder="What do you like doing?"
              rows="4"
            />
          </label>

          <label>
            Specific interests
            <input
              type="text"
              value={interests}
              onChange={(event) => setInterests(event.target.value)}
              placeholder="Minecraft, Tyler, the Creator, horror movies..."
            />
            <span className="form-help">
              Separate interests with commas.
            </span>
          </label>

          <button type="submit">
            Save changes
          </button>

        </form>

        {message && <p>{message}</p>}

      </main>

    </div>
  )
}

export default EditProfile