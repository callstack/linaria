import { styled } from '../react';

export const T1 = styled.h1`background: #111;`;
export const T2 = styled.h2`background: #222;`;
export const T3 = styled.h3`${T2} { background: #333; }`;
