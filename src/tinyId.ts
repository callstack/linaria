import incstr from 'incstr';

const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
// If these strings are found in the resulting generator, find another one
const banned_words = ['ad', 'banner'];

function valid(string: string) {
  if (/^[0-9]/.test(string)) {
    return false;
  }
  return !banned_words.some(word => string.includes(word));
}

type Map = {
  [key: string]: string;
};

function generator() {
  const map: Map = {};
  const next = incstr.idGenerator({ alphabet });

  return function(string: string) {
    if (map[string]) {
      return map[string];
    }

    let id;
    while (!valid((id = next()))) {
      // empty
    }
    return (map[string] = id);
  };
}

const re = /linaria--.*?--linaria/g;

const optimizeLinaria = generator();

export default function(source: string) {
  return source.replace(re, optimizeLinaria);
}
