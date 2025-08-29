import express from "express";
import session from "express-session";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(session({ secret: "segredo", resave: false, saveUninitialized: true }));

const PORT = process.env.PORT || 5000;
const DERIV_APP_ID = "98425"; // App ID do seu projeto
const REDIRECT_URI = process.env.REDIRECT_URI || "https://meu-frontend.netlify.app";

// Rota para iniciar login
app.get("/login", (req, res) => {
  const url = `https://oauth.deriv.com/oauth2/authorize?app_id=${DERIV_APP_ID}&redirect_uri=${REDIRECT_URI}`;
  res.redirect(url);
});

// Callback / rota principal para capturar tokens
app.get("/", (req, res) => {
  const { acct1, token1, acct2, token2, acct3, token3, acct4, token4 } = req.query;

  if (token1) {
    // Armazena tokens na sessão
    req.session.tokens = { acct1, token1, acct2, token2, acct3, token3, acct4, token4 };
    return res.send(`<h2>✅ Login feito! <br><a href="/start-bot">Iniciar Bot</a></h2>`);
  }

  // Se não tiver tokens, mostra link para login
  res.send('<a href="/login">🔑 Login com Deriv</a>');
});

// Rota para iniciar o bot
app.get("/start-bot", async (req, res) => {
  const tokens = req.session.tokens;
  if (!tokens) return res.send("⚠️ Faça login primeiro");

  try {
    // Exemplo: usando token1 para abrir contrato CALL de 1 minuto
    const trade = await axios.post(
      "https://api.deriv.com/v3/trade",
      {
        buy: 1,
        parameters: {
          contract_type: "CALL",
          symbol: "R_10",
          duration: 1,
          duration_unit: "m",
          basis: "stake",
          amount: 1,
          currency: "USD",
        },
      },
      { headers: { Authorization: `Bearer ${tokens.token1}` } }
    );

    res.json({ status: "Bot iniciado ✅", trade: trade.data });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.send("Erro ao executar trade");
  }
});

app.listen(PORT, () => console.log(`🚀 Backend rodando na porta ${PORT}`));

