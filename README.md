# skillhunt. (frontend)
npm install && npm run dev
- All sample data lives in src/data.js (replace loadWorkshops with fetch('/api/workshops') later).
- Registration POSTs to /api/registrations and only shows success when the response is ok AND includes an `id`.
  Expected: 201 {id} | 409 duplicate | 422 {errors:{field:msg}}. Until the backend exists, the form shows an honest error.
