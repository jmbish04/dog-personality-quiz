
# 🐶 Dog Personality Quiz – Project Specification

A Cloudflare Worker app using Worker AI, D1, R2, and Tailwind CSS to create a personalized dog personality quiz experience with rich visuals, AI-generated images, and interactive results.

---

## 🔧 Technologies Used

- **Cloudflare Workers**
- **Hono Router**
- **D1 (SQLite-based DB)**
- **R2 (Object Storage for Images)**
- **Worker AI** (text + image generation)
- **Tailwind CSS**

---

## 🧩 Quiz UX Design

### 📋 Step-Based Quiz (max 20 pages)
1. First 5–6 steps: basic info (name, breed, age, gender, image upload)
2. Mid section: 8–10 standard multiple-choice questions (personality)
3. Final 5 steps: AI-generated trait-specific MCQs (based on earlier answers)

> **No freeform text** — all inputs are button-based multiple choice.

---

## 🐾 Personality Traits (7 total)

Each trait has:
- AI-generated label + emoji
- Summary description
- AI-edited image (based on real photo or AI base)
- Interactive buttons (ask more, regenerate image)

### Trait List:
1. **Love**
2. **Loyalty**
3. **Playfulness**
4. **Intelligence**
5. **Independence**
6. **Mischief**
7. **Food Drive**

---

## 🧠 Result Page Layout (Per Trait Section)

Each section includes:

### 🎀 Hero Trait Block
- **Trait Name** + AI-generated **score label** and emoji  
  _e.g., "LOVE – Lovey-Dovey Snugglebug 💘"_
- **Sub-description**: _"This pup wears their heart on their paw!"_
- **AI Image**:
  - Circular image (cropped)
  - Ribbon overlay with score label
  - Animated trait-themed background (e.g. hearts, food sparkles)
- **Q&A Explanation**:
  - Relevant questions and the user's answers
- **Interactive Buttons**:
  - "Ask about [Trait]"
  - "Generate new [Trait] image"

---

## 🖼️ Image Handling

### Photo Upload
- User may optionally upload a dog photo
- Stored in R2
- Used for all trait-based AI image editing

### Fallback Generation
- If no photo, AI generates one based on:
  - Dog's name, breed, age
- This becomes the base for all trait edits

---

## 🗃️ D1 Database Schema

```sql
sessions (id, slug, dog_name, breed, age, gender, photo_url)
questions (id, session_id, text, options TEXT, order_index)
answers (id, question_id, selected_option)
results (
  id, session_id, title, summary,
  scores JSON,             -- { "love": { label, emoji, desc } }
  generated_images JSON,   -- { "love": "r2key1", ... }
  created_at TIMESTAMP
)
ai_images (
  id, session_id, type TEXT, trait TEXT, r2_key TEXT,
  created_at TIMESTAMP
)
```

---

## 🎨 Result Image Generation Flow

- AI uses:
  - Trait name
  - Score
  - Dog name, breed, age
  - Uploaded or base AI image
- Produces:
  - Stylized image for trait + score
  - Saved to R2: `r2/results/{slug}-{trait}.png`
  - Referenced in `results.generated_images`

---

## 🔄 AI-Generated Questions (Final 5 pages)

For each trait (love, loyalty, etc):
- Use prompt:  
  > "Generate 1 fun multiple-choice question to assess [TRAIT], based on what we know: [prior answers]. Provide 3–4 short answer options."

- The frontend shows:
  - The question as page content
  - Answer options as buttons

---

## 🌐 Final Results Page (`/results/:slug`)

Includes:
- Overall personality title  
  _e.g., “Fluffy is a Lovable Mischief Maker”_
- All 7 trait sections as described above
- Full quiz question/answer summary
- **Interactive chat** to ask more about results
- **Image re-generation panel**

There should be a button to share the results so if users are on iPhone for example it opens the share window for th user to text a link to a friend or however they go about inviting others 

The user should also be able to share individual photos 

---

## ✅ Summary

This project uses AI to deliver a rich, customized personality breakdown with themed visuals, playful language, and a shareable experience. Every trait gets its moment to shine with visual storytelling and interactive depth.

