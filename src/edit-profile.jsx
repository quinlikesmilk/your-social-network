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

  const [avatarFile, setAvatarFile] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)

  const [backgroundType, setBackgroundType] =
    useState("color")
  const [backgroundColor, setBackgroundColor] =
    useState("#ffffff")
  const [gradientStart, setGradientStart] =
    useState("#ffffff")
  const [gradientEnd, setGradientEnd] =
    useState("#1aab65")
  const [backgroundFile, setBackgroundFile] =
    useState(null)
  const [backgroundImagePath, setBackgroundImagePath] =
    useState("")

  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      const { data: userData } =
        await supabase.auth.getUser()

      if (!userData.user) return

      const { data: profileData, error } =
        await supabase
          .from("profiles")
          .select(
            "username, age, school, location, state, bio, hobbies, interests, profile_background_type, profile_background_value, profile_background_secondary, profile_background_image_url"
          )
          .eq("id", userData.user.id)
          .single()

      if (error) {
        console.error("Profile error:", error)
        setMessage("Could not load your profile.")
        return
      }

      setUsername(profileData.username || "")
      setAge(profileData.age || "")
      setSchool(profileData.school || "")
      setLocation(profileData.location || "")
      setState(profileData.state || "")
      setBio(profileData.bio || "")
      setHobbies(profileData.hobbies || "")
      setInterests(
        (profileData.interests || []).join(", ")
      )

      const type =
        profileData.profile_background_type || "color"

      setBackgroundType(type)

      if (type === "gradient") {
        const colors = (
          profileData.profile_background_value || "#ffffff"
        ).split("|")

        setGradientStart(colors[0] || "#ffffff")
        setGradientEnd(
          profileData.profile_background_secondary ||
          colors[1] ||
          "#1aab65"
        )
      } else {
        setBackgroundColor(
          profileData.profile_background_value || "#ffffff"
        )
      }

      setBackgroundImagePath(
        profileData.profile_background_image_url || ""
      )
    }

    loadProfile()
  }, [])

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    setMessage("Saving...")

    try {
      const { data: userData, error: authError } =
        await supabase.auth.getUser()

      if (authError || !userData.user) {
        setMessage("You are not logged in.")
        return
      }

      const userId = userData.user.id
      const maxFileSize = 5 * 1024 * 1024

      const filesToCheck = [
        [avatarFile, "Profile picture"],
        [bannerFile, "Banner image"],
        [backgroundFile, "Background image"],
      ]

      for (const [file, label] of filesToCheck) {
        if (!file) continue

        if (!file.type.startsWith("image/")) {
          setMessage(`${label} must be an image.`)
          return
        }

        if (file.size > maxFileSize) {
          setMessage(
            `${label} must be smaller than 5 MB.`
          )
          return
        }
      }

      const interestList = interests
        .split(",")
        .map((interest) => interest.trim())
        .filter(Boolean)

      async function uploadImage(file, prefix) {
        if (!file) return null

        const safeName = file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        )

        const path =
          `${userId}/${prefix}-${Date.now()}-${safeName}`

        const { error } = await supabase.storage
          .from("profile-images")
          .upload(path, file, { upsert: false })

        if (error) throw error

        return path
      }

      const avatarUrl = await uploadImage(
        avatarFile,
        "avatar"
      )

      const bannerUrl = await uploadImage(
        bannerFile,
        "banner"
      )

      let savedBackgroundImagePath =
        backgroundImagePath

      if (backgroundType === "image") {
        if (backgroundFile) {
          savedBackgroundImagePath =
            await uploadImage(
              backgroundFile,
              "background"
            )
        }

        if (!savedBackgroundImagePath) {
          setMessage(
            "Choose a background image first."
          )
          return
        }
      }

      let backgroundValue = backgroundColor

      if (backgroundType === "gradient") {
        backgroundValue = gradientStart
      }

      const updates = {
        username,
        age: age ? Number(age) : null,
        school,
        location,
        state,
        bio,
        hobbies,
        interests: interestList,
        profile_background_type: backgroundType,
        profile_background_value: backgroundValue,
        profile_background_secondary: gradientEnd,
        profile_background_image_url:
          savedBackgroundImagePath || null,
      }

      if (avatarUrl) updates.avatar_url = avatarUrl
      if (bannerUrl) updates.banner_url = bannerUrl

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)

      if (error) throw error

      setBackgroundImagePath(
        savedBackgroundImagePath
      )
      setAvatarFile(null)
      setBannerFile(null)
      setBackgroundFile(null)
      setMessage("Profile saved!")

    } catch (error) {
      console.error("Save error:", error)
      setMessage(
        error.message || "Could not save your profile."
      )
    } finally {
      setSaving(false)
    }
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
        <a href="/profile" className="back">
          ← back to profile
        </a>

        <h2>Edit your profile</h2>

        <form
          className="profile-form"
          onSubmit={handleSave}
        >
          <label>
            Profile picture
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setAvatarFile(
                  event.target.files?.[0] || null
                )
              }
            />
          </label>

          <label>
            Banner image
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setBannerFile(
                  event.target.files?.[0] || null
                )
              }
            />
          </label>

          <hr />

          <h3>Customize your background 🎨</h3>

          <label>
            Background type
            <select
              value={backgroundType}
              onChange={(event) =>
                setBackgroundType(event.target.value)
              }
            >
              <option value="color">Solid color</option>
              <option value="gradient">Gradient</option>
              <option value="image">Custom image</option>
            </select>
          </label>

          {backgroundType === "color" && (
            <label>
              Background color
              <input
                type="color"
                value={backgroundColor}
                onChange={(event) =>
                  setBackgroundColor(event.target.value)
                }
              />
            </label>
          )}

          {backgroundType === "gradient" && (
            <>
              <label>
                First gradient color
                <input
                  type="color"
                  value={gradientStart}
                  onChange={(event) =>
                    setGradientStart(event.target.value)
                  }
                />
              </label>

              <label>
                Second gradient color
                <input
                  type="color"
                  value={gradientEnd}
                  onChange={(event) =>
                    setGradientEnd(event.target.value)
                  }
                />
              </label>

              <div
                aria-label="Gradient preview"
                style={{
                  height: "100px",
                  border: "1px solid #ddd",
                  background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                }}
              />
            </>
          )}

          {backgroundType === "image" && (
            <>
              <label>
                Background image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setBackgroundFile(
                      event.target.files?.[0] || null
                    )
                  }
                />
                <span className="form-help">
                  Choose an image smaller than 5 MB.
                </span>
              </label>

              {backgroundImagePath && !backgroundFile && (
                <p className="form-help">
                  You already have a background image saved.
                  Upload another to replace it.
                </p>
              )}
            </>
          )}

          <hr />

          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              required
            />
          </label>

          <label>
            Age
            <input
              type="number"
              value={age}
              onChange={(event) =>
                setAge(event.target.value)
              }
              min="13"
              max="19"
            />
          </label>

          <label>
            School
            <input
              type="text"
              value={school}
              onChange={(event) =>
                setSchool(event.target.value)
              }
              placeholder="Your school"
            />
          </label>

          <label>
            Community / City
            <input
              type="text"
              value={location}
              onChange={(event) =>
                setLocation(event.target.value)
              }
              placeholder="Your city or community"
            />
          </label>

          <label>
            State
            <input
              type="text"
              value={state}
              onChange={(event) =>
                setState(event.target.value)
              }
              placeholder="Your state"
            />
          </label>

          <label>
            Bio
            <textarea
              value={bio}
              onChange={(event) =>
                setBio(event.target.value)
              }
              placeholder="Tell people a little about yourself"
              rows="4"
            />
          </label>

          <label>
            Hobbies
            <textarea
              value={hobbies}
              onChange={(event) =>
                setHobbies(event.target.value)
              }
              placeholder="What do you like doing?"
              rows="4"
            />
          </label>

          <label>
            Specific interests
            <input
              type="text"
              value={interests}
              onChange={(event) =>
                setInterests(event.target.value)
              }
              placeholder="Minecraft, music, horror movies..."
            />
            <span className="form-help">
              Separate interests with commas.
            </span>
          </label>

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>

        {message && <p role="status">{message}</p>}
      </main>
    </div>
  )
}

export default EditProfile