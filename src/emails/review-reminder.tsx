import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface ReviewReminderEmailProps {
  userName: string;
  totalCards: number;
  overdueCards: number;
  todayCards: number;
  deckBreakdown: {
    deckName: string;
    deckId: string;
    cardCount: number;
  }[];
  reviewUrl: string;
}

export const ReviewReminderEmail = ({
  userName,
  totalCards,
  overdueCards,
  todayCards,
  deckBreakdown,
  reviewUrl,
}: ReviewReminderEmailProps) => {
  const previewText = `You have ${totalCards} cards ready for review`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>📚 Time to Review!</Heading>
          </Section>

          <Text style={greeting}>Hi {userName},</Text>

          <Text style={paragraph}>
            You have <strong>{totalCards} cards</strong> ready for review today.
            {overdueCards > 0 && (
              <> Including <span style={overdueText}>{overdueCards} overdue cards</span> that need your attention.</>
            )}
          </Text>

          <Section style={statsSection}>
            <div style={statBox}>
              <Text style={statNumber}>{overdueCards}</Text>
              <Text style={statLabel}>Overdue</Text>
            </div>
            <div style={statBox}>
              <Text style={statNumber}>{todayCards}</Text>
              <Text style={statLabel}>Due Today</Text>
            </div>
            <div style={statBox}>
              <Text style={statNumber}>{totalCards}</Text>
              <Text style={statLabel}>Total Ready</Text>
            </div>
          </Section>

          {deckBreakdown.length > 0 && (
            <>
              <Heading as="h2" style={h2}>Cards by Deck</Heading>
              <Section style={deckList}>
                {deckBreakdown.map((deck) => (
                  <div key={deck.deckId} style={deckItem}>
                    <Text style={deckName}>{deck.deckName}</Text>
                    <Text style={cardCount}>{deck.cardCount} cards</Text>
                  </div>
                ))}
              </Section>
            </>
          )}

          <Section style={buttonSection}>
            <Button style={button} href={reviewUrl}>
              Start Review Session
            </Button>
          </Section>

          <Text style={tip}>
            💡 <strong>Pro tip:</strong> Consistent daily reviews help you remember characters better!
            Even reviewing just 10 cards a day makes a big difference.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            You're receiving this because you have review reminders enabled.{' '}
            <Link href={`${reviewUrl}/settings/notifications`} style={link}>
              Manage your notification preferences
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 20px 0',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
};

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '30px 20px 15px',
};

const greeting = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 20px',
};

const paragraph = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 20px',
};

const overdueText = {
  color: '#e74c3c',
  fontWeight: 'bold',
};

const statsSection = {
  display: 'flex',
  justifyContent: 'space-around',
  margin: '30px 20px',
  padding: '20px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
};

const statBox = {
  textAlign: 'center' as const,
  flex: 1,
};

const statNumber = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#333',
  margin: '0',
};

const statLabel = {
  fontSize: '12px',
  color: '#666',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '4px 0 0',
};

const deckList = {
  margin: '0 20px',
};

const deckItem = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: '#f8f9fa',
  borderRadius: '6px',
  marginBottom: '8px',
};

const deckName = {
  fontSize: '15px',
  color: '#333',
  fontWeight: '500',
  margin: 0,
};

const cardCount = {
  fontSize: '14px',
  color: '#666',
  margin: 0,
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#f7cc48',
  borderRadius: '8px',
  color: '#000',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const tip = {
  backgroundColor: '#f0f8ff',
  border: '1px solid #b3d9ff',
  borderRadius: '6px',
  padding: '16px',
  margin: '30px 20px',
  fontSize: '14px',
  lineHeight: '22px',
  color: '#333',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '30px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '0 20px',
  textAlign: 'center' as const,
};

const link = {
  color: '#556cd6',
  textDecoration: 'underline',
};

export default ReviewReminderEmail;