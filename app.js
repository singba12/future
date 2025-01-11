const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration CORS (mettez l'origine exacte si connue, sinon laissez *)
app.use(cors({ origin: 'https://future-9sfn.onrender.com' }));
app.use(bodyParser.json());

// Fonction pour convertir une date en timestamp Unix (ms)
function toTimestamp(date) {
    return new Date(date).getTime();
}

// Fonction pour valider les entrées utilisateur
function validateInput(symbol, dailyInvestment, startDate, endDate) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // Format YYYY-MM-DD

    if (!symbol.match(/^[A-Z]{3,5}[A-Z]{3}$/)) {
        throw new Error("Le symbole de la cryptomonnaie doit être au format 'BTCUSDT'.");
    }
    if (isNaN(dailyInvestment) || dailyInvestment <= 0) {
        throw new Error("Le montant de l'investissement journalier doit être un nombre positif.");
    }
    if (!startDate.match(dateRegex) || !endDate.match(dateRegex)) {
        throw new Error("Les dates doivent être au format YYYY-MM-DD.");
    }
}

// Route pour calculer le bénéfice ou la perte
app.post('/calculate', async (req, res) => {
    const { symbol, dailyInvestment, startDate, endDate } = req.body;

    try {
        // Validation des entrées utilisateur
        validateInput(symbol, dailyInvestment, startDate, endDate);

        const startTime = toTimestamp(startDate);
        const endTime = toTimestamp(endDate);
        let totalInvested = 0;
        let totalBTC = 0;
        let currentStartTime = startTime;
        let lastPrice = 0;
        let startPrice = null; // Prix initial de la cryptomonnaie

        // Récupération des données via l'API Binance
        while (currentStartTime < endTime) {
            try {
                const response = await axios.get('https://api.binance.com/api/v3/klines', {
                    params: {
                        symbol: symbol,
                        interval: '1d',
                        startTime: currentStartTime,
                        endTime: Math.min(currentStartTime + 1000 * 86400000, endTime),
                        limit: 1000
                    },
                    timeout: 10000 // Timeout de 10 secondes
                });

                const data = response.data;

                // Vérifiez si des données ont été récupérées
                if (data.length === 0) {
                    break; // Sortir si aucune donnée n'est disponible
                }

                for (const day of data) {
                    const closePrice = parseFloat(day[4]);
                    totalBTC += dailyInvestment / closePrice;
                    totalInvested += dailyInvestment;
                    lastPrice = closePrice;

                    // Assigner le prix initial uniquement lors de la première journée d'investissement
                    if (startPrice === null) {
                        startPrice = closePrice;
                    }
                }

                // Avancer dans la période
                currentStartTime += 1000 * 86400000;

            } catch (apiError) {
                console.error("Erreur de l'API Binance :", apiError.message);
                return res.status(500).json({ error: "Erreur lors de la récupération des données de Binance." });
            }
        }

        // Vérifiez que startPrice a été assigné
        if (startPrice === null) {
            return res.status(400).json({ error: "Aucune donnée disponible pour la période spécifiée." });
        }

        // Calcul du portefeuille
        const portfolioValue = totalBTC * lastPrice;
        const profitOrLoss = portfolioValue - totalInvested;

        res.json({
            symbol,
            totalInvested,
            portfolioValue,
            startPrice,
            lastPrice,
            profitOrLoss,
            percentageChange: ((profitOrLoss / totalInvested) * 100).toFixed(2)
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Lancement du serveur
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
