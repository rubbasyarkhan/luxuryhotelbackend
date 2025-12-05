import { transporter } from "../config/mail-config.js";
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

async function sendMail({
    email = [],
    htmlTemplate = "",
    templateName = null,
    templateVariables = {}
}) {
    try {
        let finalHtmlTemplate = htmlTemplate;
        let subject;

        if (templateName) {
            const db = mongoose.connection.db;
            const template = await db.collection('EmailTemplates').findOne({ name: templateName });

            if (template) {
                finalHtmlTemplate = template.htmlTemplate;
                subject = template.subject;

                Object.keys(templateVariables).forEach(key => {
                    const placeholder = `{{${key}}}`;
                    finalHtmlTemplate = finalHtmlTemplate.replace(new RegExp(placeholder, 'g'), templateVariables[key]);
                });
            } else {
                console.warn(`Template '${templateName}' not found, using provided subject and htmlTemplate`);
            }
        }

        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            subject,
            to: email.join(", "),
            html: finalHtmlTemplate,
        });

        return info;
    } catch (error) {
        console.error('Send mail error:', error);
        throw error;
    }
}

export default sendMail;