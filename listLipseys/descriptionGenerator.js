function descriptionGenerator(item){
    var title = item.manufacturer + " " + item.model + " " + item.caliberGauge + " " + item.capacity + " | " + item.upc;
    let html = "<div style='padding:0;margin:0;background-color:#ffffff;border:1px solid gainsboro;color:black;font-family:Arial, Helvetica, sans-serif;margin:0px;padding:30px;'>";
    html = html + "<img alt='SEC Guns' height='148' src='https://secguns.com/wp-content/uploads/2022/07/White-Background-Navy-Blue-Logo-3882-x-4565-01-2-1-e1658779192334.jpg' style='max-width: 100px; margin:10px auto; display:block;'/>";
    
    html = html + "<a style='display:block;background-color:#031834;color:white;padding:10px 30px;border-radius: 5px;text-decoration: none;margin:20px auto;width:fit-content;' href='https://www.gunbroker.com/All/search?IncludeSellers=2795514' target='_blank'>VIEW MORE LISTINGS</a>";

    html = html + "<p style='color:red; font-size:24px;text-align: center; font-weight: bold;'>Due to high volume, shipping will take 7-10 business days.</p>";
    
    html = html + "<div style='width: 100%;background-color: #6de086;padding: 10px;display: flex;border-radius: 5px;border: 2px solid #5cbe71;box-sizing:border-box;margin-bottom:5px;'>";
    html = html + "<img style='width:25px;height:25px;' src='https://secguns.com/wp-content/uploads/2022/12/credit-card.png'/>";
    html = html + "<p style='line-height:25px;font-weight:bold;text-transform:uppercase;margin-bottom:0; margin-left:10px; margin-right:0; margin-top:0;'>No credit card fee!</p>";
    html = html + "</div>";

    html = html + "<hr style='border:1px solid gainsboro;margin:20px 0;'/>";

    html = html + "<h2 style='line-height:1.4em;'>"+ title +"</h2>";
    html = html + "<p style='background-color:gainsboro;color:black;width:fit-content;padding:7px;border-radius:3px;'><strong>UPC:</strong> "+ item.upc +"</p>";

    html = html + "<h3 style='width:100%;border-bottom:1px solid black;'>Firearm Specifications</h3>";
    html = html + "<div style='line-height: 1.5em;padding:20px 0;'>";

    if(item.type != null){ html = html + "Type: "+item.type+"<br />" };
    if(item.action != null){ html = html + "Action: "+item.action+"<br />" };
    if(item.capacity != null){ html = html + "Capacity: "+item.capacity+"<br />" };
    if(item.overallLength != null){ html = html + "Overall Length: "+item.overallLength+"<br />" };
    if(item.weight != null){ html = html + "Weight: "+item.weight+"<br />" };
    if(item.safety != null){ html = html + "Safety: "+item.safety+"<br />" };
    if(item.frame != null){ html = html + "Frame Type: "+item.frame+"<br />" };
    if(item.finish != null){ html = html + "Finish: "+item.finish+"<br />" };
    if(item.sights != null){ html = html + "Sights: "+item.sights+"<br />" };
    if(item.sightsType != null){ html = html + "Sights Type: "+item.sightsType+"<br />" };
    if(item.stockFrameGrips != null){ html = html + "Grips: "+item.stockFrameGrips+"<br />" };
    if(item.magazine != null){ html = html + "Magazine(s): "+item.magazine+"<br />" };
    if(item.additionalFeature1 != null){ html = html + "Additional Feature: "+item.additionalFeature1+"<br />" };
    if(item.additionalFeature2 != null){ html = html + "Additional Feature: "+item.additionalFeature2+"<br />" };
    if(item.additionalFeature3 != null){ html = html + "Additional Feature: "+item.additionalFeature3+"<br />" };
    html = html + "</div>";

    html = html + "<hr style='border:1px solid gainsboro;margin:20px 0;'/>";
    
    html = html + "<div id='terms'>";
    html = html + "<h2 style='margin-bottom:10px;'>BUYING & PAYING</h2>";

    html = html + "<p style='color:rgb(230, 49, 49);font-weight:bold;margin:15px 0;'>BUYER: KNOW YOUR STATE&#39;S LAWS REGARDING THE SALES, PURCHASING, AND OWNERSHIP OF FIREARMS AND FIREARM PARTS/ACCESSORIES</p>";

    html = html + "<p style='line-height: 1.2em;margin-bottom:10px;'><strong>1)</strong> Please Provide the following:<br />";
    html = html + "&nbsp;&nbsp;&nbsp; A- Payment for the item and<br />";
    html = html + "&nbsp;&nbsp;&nbsp; B- copy of a Federal Firearms License (FFL) from a licensed dealer in your state.</p>";

    html = html + "<p style='line-height: 1.2em;margin-bottom:10px;'><strong>2)</strong> PLEASE DO NOT BID IF YOU DO NOT INTEND ON PURCHASING FROM US. YOU WILL BE REPORTED TO GUN BROKER.</p>";

    html = html + "<p style='line-height: 1.2em;margin-bottom:10px;'><strong>3)</strong> Payments are due within 7 days of the closing of this auction. If you are mailing in your payment, we understand that it takes time. Please notify us of your intent to mail in your payment. We DO file NON-PAYING BIDDER REPORTS through Gunbroker.</p>";

    html = html + "<p style='line-height: 1.2em;margin-bottom:10px;'><strong>4)</strong> Please use Gunbroker Checkout System to record payment even if you are mailing in your payment. That way both parties have a record of payment method.</p>";
        
    html = html + "<p style='line-height: 1.2em;margin-bottom:10px;'><strong>5)</strong> Through Gunbroker Checkout system we do accept Visa, MasterCard, American Express, Discover, Diners Club, EnRoute, and JCB Cards.</p>";
        
    html = html + "<p style='line-height: 1.2em;margin-bottom:10px;'><strong>6)</strong> You can also mail-in: Personal Check, Cashier Check, Money Order. We only ship after payment is cleared which usually takes upto 14 days.</p>";

    html = html + "<p style='line-height: 1.2em;margin-bottom:10px;'><strong>7)</strong> Due to the nature of sale (firarms) our credit card merchant processing gatway require 7 days hold before the payment can clear, so we shipp the firarm within 7-10 days after payment is made using credit card.</p>";

    html = html + "<p style='line-height: 1.2em;margin-bottom:10px;'><strong>8)</strong> We DO NOT accept Amazon Pay.</p>";

    html = html + "<p style='line-height: 1.2em;margin-bottom:10px;'><strong>9)</strong> As soon as you place a bid on one of our guns, you are agreeing to our terms and conditions. You acknowledge that ALL firearms MUST ship to a Federally Licensed Firearms dealer (FFL holder). You further agree to a 30% restocking fee for all cancelled orders (for ANY reason) particularly for those cancelled for such reasons as you do not want to ship to an FFL dealer or you are DENIED transfer of firearms. If for some reason a firearm cannot be picked up from the destination dealer, background check is denied, or you have provided an incorrect shipping address/invalid shipping information, then the customer will be responsible for return freight charges or any additional charges to reship your product or a 30% restocking fee if the order is cancelled for any reason. WE DO NOT MAKE EXCEPTIONS TO THIS RULE.</p>";
        
    html = html + "<h2 style='margin-bottom:10px;'>SHIPPING</h2>";
        
    html = html + "<p style='line-height: 1.2em;margin-bottom:10px;'><strong>1)</strong> If the firearm is DENIED transfer to you it will be your responsibility to have your FFL dealer dispose of the firearm. You also have the option of having them ship firearm back to us for a partial refund.(Restocking fees will be applied: Restocking fees of a minimum $150 or 30% of the purchased price (whatever greater) will be deducted from the refund amount.)</p>";
        
    html = html + "<p style='line-height: 1.2em;margin-bottom:10px;'><strong>2)</strong> Shipping is not refundable in any circumstance. Unless there was an error on our behalf, such as incorrect item was shipped based on Gunbroker.com win.</p>";
        
    html = html + "<p style='line-height: 1.2em;margin-bottom:10px;'><strong>3)</strong> We do not accept returns or exchanges on items, they are SOLD AS IS with our designs. All Sales are FINAL.</p>";
        
    html = html + "<p style='line-height: 1.2em;margin-bottom:10px;'><strong>4)</strong> We do not offer any inspection periods. All firearms should be checked over by your Gunsmith prior to being shot or handled. In the event a firearm must be returned to us, the shipping and Gunbroker.com fees are never refundable under any circumstances.</p>";
        
    html = html + "<p style='line-height: 1.2em;margin-bottom:10px;'><strong>5)</strong> We only ship firearms to Federal Firearms License holders or FFL for short. Please let us know who your FFL dealer is as we may already have a copy of their license on file with us. If not they can email it to us. We will provide email after winning the listing per Gunbroker policy. Please make sure they include your first and last name as it appears on GunBroker, your auction number, invoice number, or order number. Failure to have this document emailed to us WILL delay your shipment. It is YOUR (the buyer&#39;s) responsibility to ensure we receive a copy of your dealer&#39;s FFL.</p>";

    html = html + "<p style='line-height: 1.2em;margin-bottom:10px;'><strong>6)</strong> Please take your time to inspect all firearms thoroughly before proceeding with the transfer. Once a new firearm is transferred to you, it is considered used, even if unfired.</p>";
        
    html = html + "<p style='line-height: 1.2em;margin-bottom:10px;'>Consequently, we cannot accept returns on firearms once they have been transferred into your possession. Upon discovering a defect after the transfer, the firearm MUST be returned directly to the the manufacturer for replacement or repair (in accordance with manufacturer&#39;s warranty policy).</p>";
        
    html = html + "<p style='line-height: 1.2em;margin-bottom:10px;'>By sending a defective firearm directly to the manufacturer, you can avoid the unnecessary transfer fees associated with returning the firearm to us through your local FFL dealer. Manufacturer repaired firearms can be returned directly to the customer without additional FFL transfer or associated fees.</p>";

    html = html + "<p style='line-height: 1.2em;margin-bottom:10px;'><strong>7)</strong> All orders are shipped within 7-10 business days using UPS upon receiving payment &amp; verified FFL information.</p>";
        
        
    html = html + "<div style='background-color:gainsboro;padding:20px;border-radius:5px;line-height: 1.2em;margin-top:30px;'>";
    html = html + "<h4 style='margin-bottom:10px;text-transform: uppercase;'>Disclaimer:</h4>";
    html = html + "<p>Buyer is solely responsible for determining that a used gun is safe to shoot. The firearms offered have not been test fired but have been given a visual inspection only for auction purposes. It is recommended that every used firearm be inspected by a qualified gunsmith before firing. By bidding, the buyer agrees to hold seller harmless against damages, injury, or death caused by defective merchandise, misuse, or disregard. By purchasing this item, you (Buyer) agree to release seller from all liability, whether criminal or civil, arising from the purchase, ownership, possession, use or misuse of this item. You further agree to all the terms set forth in this listing and by GunBroker.com.</p>";
    html = html + "</div>";
    html = html + "</div>";
    html = html + "</div>";




    return html;
}

export default descriptionGenerator;