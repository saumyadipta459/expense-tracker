const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

const STRAPI_URL = 'http://strapi.koders.in/api/expenses';

// CRUD endpoints
app.get('/expenses', async (req, res) => {
    try {
        const response = await axios.get(STRAPI_URL);
        res.json(response.data);
    } catch (error) {
        console.error('GET /expenses error:', error.response ? error.response.data : error.message);
        res.status(500).send(error.message);
    }
});

app.post('/expenses', async (req, res) => {
    try {
        console.log('POST /expenses Request Body:', req.body); // Debugging log
        const response = await axios.post(STRAPI_URL, { data: req.body }, {
            headers: { 'Content-Type': 'application/json' }
        });
        res.json(response.data);
    } catch (error) {
        console.error('POST /expenses error:', error.response ? error.response.data : error.message);
        res.status(400).send(error.response ? error.response.data : error.message);
    }
});

app.put('/expenses/:id', async (req, res) => {
    try {
        console.log('PUT /expenses Request Body:', req.body); // Debugging log
        const response = await axios.put(`${STRAPI_URL}/${req.params.id}`, { data: req.body }, {
            headers: { 'Content-Type': 'application/json' }
        });
        res.json(response.data);
    } catch (error) {
        console.error('PUT /expenses error:', error.response ? error.response.data : error.message);
        res.status(400).send(error.response ? error.response.data : error.message);
    }
});

app.delete('/expenses/:id', async (req, res) => {
    try {
        const response = await axios.delete(`${STRAPI_URL}/${req.params.id}`);
        res.json(response.data);
    } catch (error) {
        console.error('DELETE /expenses error:', error.response ? error.response.data : error.message);
        res.status(400).send(error.response ? error.response.data : error.message);
    }
});

// Schedule cron job for updating recurring expenses (runs every minute for testing)
cron.schedule('* * * * *', async () => {
    try {
        const response = await axios.get(STRAPI_URL);
        const expenses = response.data.data;
        const updatedExpenses = expenses.map(expense => {
            if (expense.attributes.frequency !== 'One-Time') {
                const frequencyMap = {
                    'Daily': 1,
                    'Weekly': 7,
                    'Monthly': 30,
                    'Quarterly': 90,
                    'Yearly': 365
                };
                const daysToAdd = frequencyMap[expense.attributes.frequency] || 0;
                const newAmount = expense.attributes.amount + (daysToAdd * expense.attributes.base);
                return axios.put(`${STRAPI_URL}/${expense.id}`, { data: { amount: newAmount } }, {
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        });
        await Promise.all(updatedExpenses);
        console.log('Recurring expenses updated successfully');
    } catch (error) {
        console.error('Error updating recurring expenses:', error.response ? error.response.data : error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
