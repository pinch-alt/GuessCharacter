const { onRequest } = require("firebase-functions/v2/https");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("firebase-functions/logger");

// 이 함수는 프론트엔드에서 호출될 보안 프록시입니다.
exports.guessCharacter = onRequest({ cors: true }, async (req, res) => {
    try {
        // API Key는 Firebase 환경 변수 또는 Secrets에서 가져옵니다.
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            logger.error("API Key is missing in environment variables.");
            return res.status(500).send({ error: "Server configuration error." });
        }

        const { playerInfo, userInput } = req.body;

        if (!playerInfo || !userInput) {
            return res.status(400).send({ error: "Missing required parameters." });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            당신은 사람들의 특징을 분석하여 누구인지 맞추는 추측 전문가입니다.
            다음은 7명의 정보입니다:
            ${playerInfo}

            사용자가 입력한 설명: "${userInput}"

            위 설명을 바탕으로 가장 일치하는 사람의 이름만 정확히 출력하세요. 
            다른 설명이나 문장은 필요 없습니다. 오직 이름만 출력하세요.
            만약 아무도 일치하지 않는다면 가장 가능성이 높은 사람의 이름을 선택하세요.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        res.status(200).send({ result: text });
    } catch (error) {
        logger.error("Error in guessCharacter function:", error);
        res.status(500).send({ error: "AI matching failed." });
    }
});
