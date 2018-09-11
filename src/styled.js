import component from './component';

export default function styled() {
  throw new Error(
    'Calling "styled" in runtime is not supported. Make sure you have set up the Babel plugin correctly.'
  );
}

styled.component = component;
