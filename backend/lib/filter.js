// Filter phone numbers and sensitive contact info from messages
const PHONE_REGEX = /(\+?[\d\s\-().]{7,15}\d)/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const WHATSAPP_REGEX = /whatsapp|wa\.me|telegram|t\.me|discord|snapchat|instagram\.com/gi;

const filterMessage = (content) => {
  let clean = content;
  let filtered = false;

  if (PHONE_REGEX.test(clean)) {
    clean = clean.replace(PHONE_REGEX, '[phone removed]');
    filtered = true;
  }
  if (EMAIL_REGEX.test(clean)) {
    clean = clean.replace(EMAIL_REGEX, '[email removed]');
    filtered = true;
  }
  if (WHATSAPP_REGEX.test(clean)) {
    clean = clean.replace(WHATSAPP_REGEX, '[contact info removed]');
    filtered = true;
  }

  return { clean, filtered };
};

module.exports = { filterMessage };
