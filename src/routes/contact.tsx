import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/weather/PageShell";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Weatherly — support and feedback" },
      {
        name: "description",
        content:
          "Get in touch with the Weatherly team by email or through our contact form for forecast issues, feedback and privacy requests.",
      },
      { property: "og:title", content: "Contact Weatherly — support and feedback" },
      {
        property: "og:description",
        content: "Email support@weatherly.app or send us a message with the contact form.",
      },
    ],
  }),
  component: ContactPage,
});

const EMAIL = "support@weatherly.app";

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(
      subject || "Weatherly enquiry",
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  const field =
    "w-full rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm text-foreground outline-none focus:border-primary";

  return (
    <PageShell title="Contact us">
      <p>
        Found a forecast that looked wrong, spotted a bug, or want a feature added? We read every
        message. Email us directly at{" "}
        <a className="underline" href={`mailto:${EMAIL}`}>
          {EMAIL}
        </a>{" "}
        — we usually reply within two working days.
      </p>

      <form onSubmit={submit} className="space-y-3 pt-2">
        <div>
          <label htmlFor="name" className="mb-1 block text-xs text-muted-foreground">
            Your name
          </label>
          <input
            id="name"
            className={field}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-xs text-muted-foreground">
            Your email
          </label>
          <input
            id="email"
            type="email"
            className={field}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="subject" className="mb-1 block text-xs text-muted-foreground">
            Subject
          </label>
          <input
            id="subject"
            className={field}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="message" className="mb-1 block text-xs text-muted-foreground">
            Message
          </label>
          <textarea
            id="message"
            rows={5}
            className={field}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
        >
          Send message
        </button>
        {sent && (
          <p className="text-xs text-muted-foreground" role="status">
            Your email app should have opened with the message ready to send. If it didn’t, write to{" "}
            {EMAIL} directly.
          </p>
        )}
      </form>
    </PageShell>
  );
}
