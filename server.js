import express from "express";
import session from "express-session";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(session({ secret: "segredo", resave: false, saveUninitialized: true }));

const PORT = process.env.PORT || 5000;
const DERIV_APP_ID = "98425"; 
const REDIRECT_URI = process.env.REDIRECT_URI;

// Rota para login
app.get("/login", (req, res) => {
  const url = `https://oauth.deriv.com/oauth2/authorize?app_id=${DERIV_APP_ID}&redirect_uri=${REDIRECT_URI}`;
  res.redirect(url);
});

// Callback OAuth da Deriv
app.get("/", async (req, res) => {
  if (req.query.code) {
    try {
      const response = await axios.get(
        `https://api.deriv.com/oauth2/token?app_id=${DERIV_APP_ID}&code=${req.query.code}`
      );
      const { access_token } = response.data;
      req.session.token = access_token;
      res.send(`<h2>✅ Login feito! <br><a href="/start-bot">Iniciar Bot</a></h2>`);
    } catch (err) {
      console.error(err);
      res.send("Erro ao autenticar");
    }
  } else {
    res.send('<a href="/login">🔑 Login com Deriv</a>');
  }
});

// Rota para iniciar o bot
app.get("/start-bot", async (req, res) => {
  if (!req.session.token) return res.send("⚠️ Faça login primeiro");

  try {
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
      { headers: { Authorization: `Bearer ${req.session.token}` } }
    );
    res.json({ status: "Bot iniciado ✅", trade: trade.data });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.send("Erro ao executar trade");
  }
});

app.listen(PORT, () => console.log(`🚀 Backend rodando na porta ${PORT}`));
