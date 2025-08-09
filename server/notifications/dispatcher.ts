import type { Request } from "express";

export interface AlertPayload {
    id: string;
    title: string;
    message: string;
    severity: string;
    createdAt: Date;
}

interface ChannelSender {
    (alert: AlertPayload): Promise<void>;
}

const emailSender: ChannelSender = async (alert) => {
    if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== "true") return;
    console.log(
        `[email] ${alert.severity.toUpperCase()} - ${alert.title}: ${
            alert.message
        }`
    );
};

const smsSender: ChannelSender = async (alert) => {
    if (process.env.ENABLE_SMS_NOTIFICATIONS !== "true") return;
    console.log(`[sms] ${alert.severity.toUpperCase()} - ${alert.title}`);
};

const channels: ChannelSender[] = [emailSender, smsSender];

export async function dispatchAlert(alert: AlertPayload) {
    await Promise.all(
        channels.map((c) =>
            c(alert).catch((err) => console.warn("Channel send failed", err))
        )
    );
}
