module.exports = function handler(request, response) {
  response.status(200).json({
    ok: true,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
  });
};
