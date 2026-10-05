// WhatsApp wants the number in international form, digits only, no "+" and no
// leading zero: "0812-3456-7890" and "+62 812 3456 7890" both become
// "6281234567890". Numbers typed with another country code are kept as they are.
export function whatsappNumber(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2); // 0062812... (international prefix)
  if (digits.startsWith("0")) return `62${digits.slice(1)}`; // 0812... (national form)
  if (digits.startsWith("8")) return `62${digits}`; // 812... (written without the 0)
  return digits; // 62812..., or another country
}

export const whatsappUrl = (phone: string) => `https://wa.me/${whatsappNumber(phone)}`;
