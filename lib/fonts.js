import { Passero_One, Roboto_Slab, Ubuntu } from 'next/font/google';

export const passero = Passero_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-passero',
});

export const robotoSlab = Roboto_Slab({
  subsets: ['latin'],
  variable: '--font-roboto-slab',
});

export const ubuntu = Ubuntu({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-ubuntu',
});