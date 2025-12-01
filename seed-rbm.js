const fs = require('fs');
const path = require('path');

async function seed() {
    try {
        // Read .env.local to get the secret
        const envPath = path.join(__dirname, '.env.local');
        if (!fs.existsSync(envPath)) {
            console.error('Error: .env.local file not found.');
            return;
        }

        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/ONE_TIME_CREATE_RBM_SECRET=(.*)/);

        if (!match) {
            console.error('Error: ONE_TIME_CREATE_RBM_SECRET not found in .env.local');
            return;
        }

        const secret = match[1].trim();

        console.log('Seeding RBM user...');

        const response = await fetch('http://localhost:3000/api/admin/seed', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                secret: secret,
                name: 'Main RBM',
                password: 'password123', // Default password
                mobile: '9999999999'
            }),
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('❌ Failed to parse JSON response.');
            console.error('Status:', response.status, response.statusText);
            console.error('Response Body Preview:', text.substring(0, 500));
            return;
        }

        if (response.ok) {
            console.log('✅ RBM User created successfully!');
            console.log('-----------------------------------');
            console.log(`Employee ID: ${data.empId}`);
            console.log(`Password:    password123`);
            console.log('-----------------------------------');
            console.log('You can now login at http://localhost:3000');
        } else {
            console.error('❌ Failed to create RBM user:', data.error);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.cause && error.cause.code === 'ECONNREFUSED') {
            console.log('Hint: Make sure the Next.js server is running (npm run dev).');
        }
    }
}

seed();
