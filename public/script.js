document.getElementById('calcForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const symbol = document.getElementById('symbol').value.toUpperCase();
    const dailyInvestment = parseFloat(document.getElementById('dailyInvestment').value);
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    try {
        const response = await fetch('http://localhost:10000/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol, dailyInvestment, startDate, endDate })
        });

        const result = await response.json();
        
        if (response.ok) {
            document.getElementById('results').innerHTML =
                `<h2>Résultats pour ${result.symbol} :</h2>
                <p>- Investissement total : ${result.totalInvested.toFixed(2)} USDT</p>
                <p>- Valeur actuelle du portefeuille : ${result.portfolioValue.toFixed(2)} USDT</p>
                <p>- Prix initial : ${result.startPrice.toFixed(2)} USDT</p>
                <p>- Prix actuel : ${result.lastPrice.toFixed(2)} USDT</p>
                <p>- Bénéfice/Perte : ${result.profitOrLoss >= 0 ? '+' : ''}${result.profitOrLoss.toFixed(2)} USDT (${result.percentageChange}%)</p>`;
        } else {
            document.getElementById('results').innerHTML =
                `<p style="color:red;">Erreur : ${result.error}</p>`;
        }
        
    } catch (error) {
        document.getElementById('results').innerHTML =
            `<p style="color:red;">Erreur : ${error.message}</p>`;
    }
});
