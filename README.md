# Team Organizer

A comprehensive team management and activity tracking application designed for agricultural field teams. This application allows Regional Business Managers (RBMs) to manage their hierarchy, track daily plans, and monitor field activities with photo evidence.

## Features

*   **Team Hierarchy Management:**
    *   Visual hierarchy view of the team (RBM -> Area Manager -> Territory Manager -> MDO).
    *   Add new team members with automatic role assignment based on the creator's role.
    *   Delete team members with cascade deletion (removes subordinates, activities, and plans).
    *   Supervisor display for non-RBM users.

*   **Activity Tracking:**
    *   Create field activities with details like Farmer Name, Village, Crop, and Photos.
    *   Upload photos directly to AWS S3 with image compression.
    *   View activities in a responsive grid layout.
    *   **Export to Excel:** Download activity reports including data from all subordinates recursively.

*   **Daily Planning:**
    *   Calendar view to manage daily plans.
    *   Add plans for specific dates with village names and remarks.

*   **User Management:**
    *   Secure authentication using NextAuth.js.
    *   Profile management (update name, mobile, profile picture).
    *   Password management with relaxed complexity rules (min 8 chars).

*   **Responsive Design:**
    *   Fully responsive UI optimized for desktop, tablet, and mobile devices.
    *   Dark mode support.

## Tech Stack

*   **Frontend:** Next.js 14 (App Router), React, Tailwind CSS
*   **Backend:** Next.js API Routes
*   **Database:** MongoDB (with Mongoose)
*   **Storage:** AWS S3
*   **Authentication:** NextAuth.js
*   **Utilities:** `xlsx` (Excel export), `browser-image-compression`, `react-hot-toast`, `lucide-react`

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd team-organizer
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root directory and add the following:
    ```env
    MONGODB_URI=your_mongodb_connection_string
    NEXTAUTH_SECRET=your_nextauth_secret
    NEXTAUTH_URL=http://localhost:3000
    AWS_REGION=your_aws_region
    AWS_ACCESS_KEY_ID=your_aws_access_key
    AWS_SECRET_ACCESS_KEY=your_aws_secret_key
    AWS_BUCKET_NAME=your_s3_bucket_name
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  **Open the app:**
    Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

This application is ready to be deployed on [Vercel](https://vercel.com).
1.  Push your code to a GitHub repository.
2.  Import the project in Vercel.
3.  Add the environment variables in the Vercel dashboard.
4.  Deploy!
