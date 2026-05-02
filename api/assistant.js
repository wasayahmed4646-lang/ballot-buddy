const { answerQuestion } = require("../src/assistantCore");

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
    const answer = await answerQuestion(body);
    return response.status(200).json(answer);
  } catch (error) {
    return response.status(error.statusCode || 500).json({
      error: error.statusCode ? error.message : "The assistant could not answer right now."
    });
  }
};
