import jsPDF from "jspdf";

const n=value=>Number(value)||0;
const fmt=value=>`INR ${n(value).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const safe=value=>String(value??"").replace(/[\r\n]+/g," ").trim()||"—";

export function downloadExpensePdf({kind="expense",record,items=[],company={}}){
  const pdf=new jsPDF({unit:"mm",format:"a4"});
  const pageW=pdf.internal.pageSize.getWidth(),pageH=pdf.internal.pageSize.getHeight(),m=14,w=pageW-m*2;
  let y=18;const payment=kind==="payment";const title=payment?"PAYMENT VOUCHER":"EXPENSE VOUCHER";
  const text=(value,x,top,max,sz=9,bold=false)=>{pdf.setFont("helvetica",bold?"bold":"normal");pdf.setFontSize(sz);const lines=pdf.splitTextToSize(safe(value),max);pdf.text(lines,x,top);return top+lines.length*(sz*.42)+1.5;};
  const heading=()=>{pdf.setTextColor(20,42,70);y=text(company.company_name||"Company",m,y,w*.62,14,true);y=text(company.address||"",m,y,w*.62,8);y=text("GSTIN: "+(company.gstin||"—"),m,y,w*.62,8);y+=4;pdf.setFillColor(18,57,102);pdf.roundedRect(m,y,w,10,1.5,1.5,"F");pdf.setTextColor(255,255,255);pdf.setFont("helvetica","bold");pdf.setFontSize(11);pdf.text(title,pageW/2,y+6.7,{align:"center"});pdf.setTextColor(30,44,61);y+=16;};
  const addHeader=()=>{pdf.setFillColor(235,242,251);pdf.rect(m,y,w,8,"F");pdf.setFont("helvetica","bold");pdf.setFontSize(7);pdf.setTextColor(40,55,74);const cols=[["#",m+2],["Description",m+10],["HSN",m+79],["Qty",m+103],["Unit",m+116],["Rate",m+132],["GST",m+148],["Taxable",m+158],["Amount",m+176]];cols.forEach(([label,x])=>pdf.text(label,x,y+5.5));y+=9;};
  heading();
  const docNo=payment?record.payment_no:record.expense_no;const date=payment?record.payment_date:record.expense_date;const payee=record.vendor_name||record.paid_to||record.payee_name;
  y=text(`${payment?"Payment No.":"Expense No."}: ${docNo||"—"}     Date: ${date||"—"}`,m,y,w,9,true);
  y=text(`${payment?"Paid To":"Supplier / Payee"}: ${payee||"—"}     ${payment?"Linked Expense":"Bill No."}: ${payment?(record.expense_no||"—"):(record.supplier_invoice_no||"—")}`,m,y,w,9);
  if(payment){y+=4;y=text(`Method: ${record.payment_method||"—"}     Account: ${record.account_name||"—"}     Reference: ${record.reference_no||"—"}`,m,y,w,9);y+=5;pdf.setFont("helvetica","bold");pdf.setFontSize(14);pdf.text("Amount: "+fmt(record.amount),m,y);y+=10;}
  else{
    y=text("Category: "+(record.category_name||"—"),m,y,w,9);y+=3;addHeader();
    items.forEach((item,i)=>{
      const description=pdf.splitTextToSize(safe(item.description),65);const needed=Math.max(7,description.length*4.3+2);
      if(y+needed>pageH-32){pdf.addPage();y=18;heading();pdf.setFontSize(8);pdf.text("Expense No.: "+(docNo||"—")+"  (continued)",m,y);y+=7;addHeader();}
      pdf.setFont("helvetica","normal");pdf.setFontSize(7.5);pdf.text(String(i+1),m+2,y+4);
      pdf.text(description,m+10,y+4);
      const vals=[[item.hsn_sac||"—",m+79],[String(n(item.qty)),m+103],[item.uom||"—",m+116],[fmt(item.rate),m+132],[n(item.gst_percent)+"%",m+148],[fmt(item.taxable_amount),m+158],[fmt(item.total_amount),m+176]];
      vals.forEach(([v,x])=>pdf.text(safe(v),x,y+4,{maxWidth:19}));
      pdf.setDrawColor(218,226,236);pdf.line(m,y+needed,w+m,y+needed);y+=needed;
    });
    y+=8;if(y>pageH-52){pdf.addPage();y=18;heading();}
    const totals=[["Subtotal",n(record.taxable_amount)+n(record.discount_amount)],["Discount",-n(record.discount_amount)],["Taxable Value",record.taxable_amount],["CGST",record.cgst],["SGST",record.sgst],["IGST",record.igst],["Other Charges",record.other_charges],["Round Off",record.round_off]];
    totals.forEach(([label,value])=>{pdf.setFont("helvetica","normal");pdf.setFontSize(8.5);pdf.text(label,m+w-74,y);pdf.text(fmt(value),m+w,y,{align:"right"});y+=5.3;});
    pdf.setFillColor(18,57,102);pdf.roundedRect(m+w-80,y,w-(w-80),9,1,1,"F");pdf.setTextColor(255,255,255);pdf.setFont("helvetica","bold");pdf.setFontSize(10);pdf.text("Grand Total",m+w-77,y+6);pdf.text(fmt(record.total_amount),m+w-3,y+6,{align:"right"});y+=16;
  }
  if(record.remarks){y=text("Notes: "+record.remarks,m,y,w,8);y+=3;}
  pdf.setFont("helvetica","normal");pdf.setFontSize(8);pdf.text("Authorized Signatory",pageW-m,y+16,{align:"right"});
  const count=pdf.getNumberOfPages();for(let p=1;p<=count;p++){pdf.setPage(p);pdf.setFontSize(8);pdf.setTextColor(100);pdf.text(`Page ${p} of ${count}`,pageW/2,pageH-8,{align:"center"});}
  const name=(docNo||"expense-document").replace(/[^a-zA-Z0-9_-]/g,"_");
  pdf.save(`${name}.pdf`);
}
