import incstr from 'incstr';

const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
// If these strings are found in the resulting generator, find another one
const bannedWords = ['ad', 'banner'];

function valid(string: string) {
  if (/^[0-9]/.test(string)) {
    return false;
  }
  return !bannedWords.some(word => string.includes(word));
}

type Map = {
  [key: string]: string;
};

interface factoryOptions {
  prefix?: string;
  suffix?: string;
  optimize: boolean;
}

export default function makeTinyId({
  prefix = '',
  suffix = '',
  optimize,
}: factoryOptions) {
  const map: Map = {};
  const next = incstr.idGenerator({ alphabet });

  function optimizer(string: string) {
    if (optimize) {
      if (map[string]) {
        return map[string];
      }

      let id;
      while (!valid((id = next()))) {
        // empty
      }
      return (map[string] = id);
    } else {
      return string;
    }
  }

  return function(string: string) {
    return `${prefix}${optimizer(string)}${suffix}`;
  };
}
