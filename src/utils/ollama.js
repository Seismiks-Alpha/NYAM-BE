import axios from 'axios'

export async function runOllama(prompt) {
  try {
    const { data } = await axios.post('http://127.0.0.1:11434/api/generate', {
      model: 'mistral',
      prompt: prompt,
      stream: false
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    return data.response || '[Model tidak merespons]'
  } catch (err) {
    console.error('❌ Error fetch ke Ollama via axios:', err.message)
    return '[Gagal menghubungi Ollama]'
  }
}
