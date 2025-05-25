export function detectIntent(question) {
  const text = question.toLowerCase()
  const userKeywords = [
    'saya',
    'berat saya',
    'tinggi saya',
    'makanan saya',
    'apakah saya',
    'kalori saya',
    'cukup tidak',
    'aktivitas saya',
    'berat badan saya',
    'tinggi badan saya',
    'kamu tau berat badan',
    'kamu tahu berat badan',
    'tahu berat saya'
  ]
  return userKeywords.some(w => text.includes(w)) ? 'personal' : 'general'
}
