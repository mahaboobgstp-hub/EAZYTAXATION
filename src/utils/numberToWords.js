const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen"
];

const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety"
];

function convertTwoDigits(num) {

  if (num < 20) {
    return ones[num];
  }

  return (
    tens[Math.floor(num / 10)] +
    (num % 10
      ? " " + ones[num % 10]
      : "")
  );

}

function convertThreeDigits(num) {

  let word = "";

  if (num >= 100) {

    word +=
      ones[Math.floor(num / 100)] +
      " Hundred ";

    num %= 100;

  }

  if (num > 0) {

    word +=
      convertTwoDigits(num);

  }

  return word.trim();

}

export function numberToWords(amount) {

  const rupees =
    Math.floor(amount);

  const paise =
    Math.round(
      (amount - rupees) * 100
    );

  let number = rupees;

  const crore =
    Math.floor(number / 10000000);

  number %= 10000000;

  const lakh =
    Math.floor(number / 100000);

  number %= 100000;

  const thousand =
    Math.floor(number / 1000);

  number %= 1000;

  const hundred =
    number;

  let words = "";

  if (crore)
    words +=
      convertThreeDigits(crore) +
      " Crore ";

  if (lakh)
    words +=
      convertThreeDigits(lakh) +
      " Lakh ";

  if (thousand)
    words +=
      convertThreeDigits(thousand) +
      " Thousand ";

  if (hundred)
    words +=
      convertThreeDigits(hundred);

  words =
    "Rupees " +
    words.trim();

  if (paise) {

    words +=
      " and " +
      convertTwoDigits(paise) +
      " Paise";

  }

  words += " Only";

  return words;

}
