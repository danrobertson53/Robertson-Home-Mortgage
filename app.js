// --- NAVIGATION & UI HELPERS ---
function toggleMobileMenu() { document.getElementById('mobileMenu').classList.toggle('active'); }
function smoothScrollTo(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - 70;
    window.scrollTo({ top: y, behavior: "smooth" });
}

function showWizard(id) {
    const sections = [
        'wizard-pur-occupancy', 'wizard-pur-primary', 'wizard-pur-second', 'wizard-pur-invest', 'wizard-pur-calc',
        'wizard-fix-flip', 'wizard-refi-goal', 'wizard-refi-calc', 'quote-form-section'
    ];
    sections.forEach(s => {
        const el = document.getElementById(s);
        if(el) el.style.display = 'none';
    });
    
    const target = document.getElementById(id);
    if(target) {
        target.style.display = 'block';
        target.classList.add('fade-in');
        setTimeout(() => smoothScrollTo(id), 50);
    }
}

function toggleBio(id) {
    const card = document.getElementById(id);
    const content = card.querySelector('.team-content');
    card.classList.toggle('active');
    content.style.maxHeight = card.classList.contains('active') ? content.scrollHeight + "px" : null;
}

function toggleFFExp(id) {
    const el = document.getElementById(id);
    el.style.display = (el.style.display === 'none') ? 'block' : 'none';
}

const formatCurrency = (num) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

function calcPI(loanAmount, ratePercent, months) {
    if(loanAmount <= 0 || ratePercent <= 0) return 0;
    const r = ratePercent / 100 / 12;
    return (loanAmount * r * Math.pow(1+r, months)) / (Math.pow(1+r, months) - 1);
}

// --- DYNAMIC RENT FIELDS LOGIC ---
function updateRentFields() {
    const units = parseInt(document.getElementById('pur-units').value) || 1;
    const occ = document.getElementById('pur-active-occ').value;
    const prog = document.getElementById('pur-active-prog').value;
    const container = document.getElementById('multi-unit-rents');
    
    container.innerHTML = ''; 
    
    if (units > 1) {
        let html = `<p style="font-size:0.85rem; color:var(--mortgage-blue); font-weight:600; margin-bottom:5px;">Estimated Rental Income (Per Unit) <span class="tooltip">ⓘ<span class="tooltiptext">For vacant units, lenders will only use 75% of the market rent determined by the appraiser to calculate your cash flow.</span></span></p><div class="form-row">`;
        
        let startUnit = (occ === 'Primary Residence') ? 2 : 1;
        
        for(let i = startUnit; i <= units; i++) {
            html += `<div class="form-group"><label>Unit ${i} Rent ($)</label><input type="number" class="unit-rent-input" placeholder="e.g. 1500"></div>`;
        }
        html += '</div>';
        container.innerHTML = html;
        container.style.display = 'block';
    } else {
        if (occ === 'Investment' || prog === 'dscr') {
            container.innerHTML = `<div class="form-row"><div class="form-group"><label>Est. Monthly Rent ($) <span class="tooltip">ⓘ<span class="tooltiptext">For vacant units, lenders will only use 75% of the market rent determined by the appraiser.</span></span></label><input type="number" class="unit-rent-input" placeholder="e.g. 2500"></div></div>`;
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }
}

// --- EDUCATION ENGINE ---
const purEduText = {
    'conv': { 
        title: "Conventional Loan", 
        concept: "The standard in mortgage financing. If you have strong credit, this is often the cheapest route.",
        fit: "Buyers with good-to-excellent credit. First-time homebuyers can put as little as 3% down on a 1-unit property, or 5% down on a multi-unit property.",
        radar: ["Requires Private Mortgage Insurance (PMI) if you put less than 20% down.", "PMI automatically drops off once you reach 20% equity."]
    },
    'homeready': { 
        title: "Fannie Mae HomeReady", 
        concept: "A conventional loan designed for creditworthy, low-to-moderate-income buyers, allowing for just a 3% down payment.",
        fit: "Buyers earning 80% or less of their area's median income looking for cheaper Mortgage Insurance than FHA offers.",
        radar: ["If you are a first-time buyer making 50% or less of the Median Income, you might score a $2,500 lender credit toward closing costs!", "You can use 'Boarder Income' (rent from someone who has lived with you for the past 12 months) to help you qualify."]
    },
    'fha': { 
        title: "FHA", 
        concept: "A government-backed loan requiring just 3.5% down that is incredibly forgiving on credit history and debt ratios.",
        fit: "Buyers with less-than-perfect credit or higher debt loads. You can use an FHA loan to buy a 2, 3, or 4-unit property with only 3.5% down, as long as you live in one of the units!",
        radar: ["FHA charges an Upfront Mortgage Insurance Premium (1.75% of the loan amount) which is rolled into your loan.", "FHA monthly mortgage insurance typically remains for the life of the loan."]
    },
    'fha-100': { 
        title: "FHA 100% CLTV Combo", 
        concept: "This program removes the biggest barrier to homeownership: the down payment. It pairs a standard 96.5% FHA first mortgage with a 3.5% second mortgage to completely cover your required down payment.",
        fit: "Cash-strapped buyers wanting to own now rather than wait. There are no income caps, and you do not need to be a first-time homebuyer to qualify.",
        radar: ["The 3.5% second mortgage is a 10-year fixed, fully amortized loan (meaning you will have a monthly payment on it).", "The interest rate on the second mortgage is set 2.0% higher than your first mortgage.", "If you sell or refinance the first mortgage later, the second mortgage must be paid off simultaneously."]
    },
    'fha-203k': { 
        title: "FHA 203(k) Renovation", 
        concept: "Found a fixer-upper? Don't let it slip away. This program allows you to finance both the purchase of the home and the cost of renovations into a single loan with just 3.5% down.",
        fit: "Visionaries willing to build sweat equity by updating a home (while hiring the pros to do the actual work!).",
        radar: ["You must be doing at least $5,000 in eligible repairs.", "A 10-20% 'contingency fund' will be added to your loan to cover unexpected cost overruns during construction.", "All work must be completed by licensed contractors."]
    },
    'va': { 
        title: "VA Loan", 
        concept: "An elite benefit for eligible military and veterans. Allows for 0% down payment and charges absolutely no monthly Mortgage Insurance.",
        fit: "Active duty military, veterans, and eligible surviving spouses.",
        radar: ["You can use your VA loan to purchase up to a 4-unit property with $0 down, as long as you live in one of the units.", "The VA charges a one-time Funding Fee (which can be rolled into the loan), unless you receive VA disability compensation."]
    },
    'usda': { 
        title: "USDA (Rural Development)", 
        concept: "A 0% down program for low-to-moderate income buyers purchasing in designated rural or suburban areas.",
        fit: "Buyers looking for property outside of major city limits who want to preserve their savings.",
        radar: ["The property must be located in a USDA-eligible area.", "There are strict household income limits to qualify.", "Only available for 1-unit Single Family properties."]
    },
    'jumbo': { 
        title: "Jumbo Financing", 
        concept: "When your dream home exceeds standard county loan limits, this program steps in, offering up to $3,000,000 in premium financing.",
        fit: "High-net-worth buyers looking at luxury, high-value, or expansive properties.",
        radar: ["Requires a minimum 20% down payment for a primary residence.", "You will generally need to show heavier cash reserves (up to 6 months of mortgage payments in the bank after closing).", "Loan amounts over $2,000,000 require two full, independent appraisals."]
    },
    'alt-doc': { 
        title: "Self-Employed (Alt-Doc)", 
        concept: "Skip the tax returns! Qualify based on the actual cash flowing through your business using 12 months of personal or business bank statements, a 1-Year P&L, or 1099 forms.",
        fit: "Business owners, freelancers, and entrepreneurs whose tax write-offs hide their true purchasing power.",
        radar: ["You must have been self-employed—and your business active—for at least two full years.", "If using bank statements, large or unusual deposits will require a written explanation.", "Alternative documentation loans typically require larger down payments (10-20%) compared to standard conventional loans."]
    },
    'conv-sec': { 
        title: "Second Home Financing", 
        concept: "Standard conventional financing for a vacation or part-time home.",
        fit: "Buyers looking for a getaway property they intend to occupy for a portion of the year.",
        radar: ["Requires a minimum 10% down payment.", "The property must be located a reasonable distance from your primary residence.", "Multi-unit properties are not allowed as second homes."]
    },
    'dscr': { 
        title: "DSCR (Debt Service) 1-4 Unit", 
        concept: "For Non-Owner Occupied Properties. No personal income required! Qualify based entirely on the property's estimated monthly rental income compared to the mortgage payment.",
        fit: "Real estate investors who want to scale their portfolio without providing personal tax returns or pay stubs.",
        radar: ["We offer tiers that even allow the property to cash flow negatively (down to a 0.75 ratio) with 25% down.", "Requires a minimum 20% down payment if the rent covers the mortgage 1-to-1.", "You must show you have cash reserves in the bank after closing."]
    },
    'dscr-5-9': { 
        title: "Multi-Family (5-9 Units) DSCR", 
        concept: "Commercial-style financing for larger residential buildings. We qualify the loan based entirely on the property's rental cash flow, meaning no personal income docs are required!",
        fit: "Experienced real estate investors looking to scale their portfolios into larger multi-family buildings.",
        radar: ["You cannot be a first-time investor.", "The property's rent must be at least 15% higher than the mortgage payment (a 1.15 DSCR).", "You'll need 6 months of payments in reserve, and no more than 2 units can be vacant at the time of purchase."]
    },
    'conv-inv': { 
        title: "Conventional Investment", 
        concept: "Standard full-documentation loan for non-owner occupied properties.",
        fit: "Investors with strong personal income profiles (W-2 or tax returns) who want the most competitive interest rates.",
        radar: ["Down payments typically range from 15% to 25% depending on how many units the property has.", "Personal debt-to-income (DTI) ratios apply."]
    }
};

const refiEduText = {
    'rt': { 
        title: "Rate & Term Refinance", 
        concept: "Designed to drop your interest rate or change your loan term (like moving from a 30-year to a 15-year).",
        fit: "Homeowners looking to lower their monthly payment or pay off their mortgage faster.",
        radar: ["Closing costs can be rolled into the new loan so you bring no cash to the table.", "You must have a 'Net Tangible Benefit' (meaning the refinance must clearly save you money or improve your loan terms)."]
    },
    'co': { 
        title: "Cash-Out & Consolidation", 
        concept: "Tap into the equity of your home to pull out a lump sum of cash.",
        fit: "Homeowners wanting to pay off high-interest credit cards, fund major renovations, or buy an investment property.",
        radar: ["You can generally only pull cash out up to 80% of your home's appraised value.", "You must have owned the property for at least 6 to 12 months to be eligible for cash-out."]
    },
    'he': { 
        title: "Home Equity (HELOC / HELOAN)", 
        concept: "Keep your low 1st mortgage exactly as it is and take out a secondary lien to access your equity.",
        fit: "Homeowners with a sub-4% interest rate on their primary mortgage who need cash.",
        radar: ["You can choose between a revolving Line of Credit (HELOC) or a fixed lump sum (HELOAN).", "Combined Loan-to-Value (CLTV) limits apply, usually capping your total debt at 85% of your home's value."]
    },
    'equity-adv': { 
        title: "Standalone 2nd Lien (Alt-Doc)", 
        concept: "A fixed-rate, closed-end second mortgage that lets you tap into your home's equity without touching your primary mortgage. And you can use alternative income docs to qualify!",
        fit: "Self-employed homeowners who want cash out but refuse to lose their 3% interest rate on their 1st mortgage.",
        radar: ["Unlike traditional bank HELOCs, you can use Bank Statements or a P&L to qualify.", "The maximum combined Loan-to-Value (CLTV) for your 1st and 2nd mortgage together is capped at 80%."]
    }
};

function openPurCalc(progId, occType) {
    document.getElementById('pur-active-prog').value = progId;
    document.getElementById('pur-active-occ').value = occType;
    
    // Build Strategy Brief
    const data = purEduText[progId];
    document.getElementById('pur-calc-title').innerText = data.title;
    
    let eduHtml = `
        <h3>The Scoop</h3>
        <p>${data.concept}</p>
        <h4>Perfect For:</h4>
        <p>${data.fit}</p>
        <h4>On Your Radar:</h4>
        <ul>
            ${data.radar.map(item => `<li>${item}</li>`).join('')}
        </ul>
    `;
    document.getElementById('pur-calc-edu').innerHTML = eduHtml;
    
    // Show/Hide specific form fields
    if(progId === 'fha-203k') {
        document.getElementById('rehab-group').style.display = 'flex';
    } else {
        document.getElementById('rehab-group').style.display = 'none';
    }

    document.getElementById('pur-units').value = "1";
    updateRentFields();

    document.getElementById('pur-result-box').style.display = 'none';
    document.getElementById('pur-success').style.display = 'none';
    document.getElementById('pur-error').style.display = 'none';
    document.getElementById('pur-warning').style.display = 'none';
    document.getElementById('pur-strategy').style.display = 'none';
    document.getElementById('pur-cashflow-box').style.display = 'none';
    document.getElementById('pur-fha100-view').style.display = 'none';

    const backBtn = document.getElementById('pur-back-btn');
    if(occType === 'Primary Residence') backBtn.setAttribute('onclick', "showWizard('wizard-pur-primary')");
    if(occType === 'Second Home') backBtn.setAttribute('onclick', "showWizard('wizard-pur-second')");
    if(occType === 'Investment') backBtn.setAttribute('onclick', "showWizard('wizard-pur-invest')");

    showWizard('wizard-pur-calc');
}

// --- MATH ENGINE ---
function runPurMath() {
    const prog = document.getElementById('pur-active-prog').value;
    const occ = document.getElementById('pur-active-occ').value;
    const price = parseFloat(document.getElementById('pur-price').value) || 0;
    let dp = parseFloat(document.getElementById('pur-dp').value) || 0;
    const rate = parseFloat(document.getElementById('pur-rate').value) || 6.5;
    const term = parseInt(document.getElementById('pur-term').value) || 360;
    const units = parseInt(document.getElementById('pur-units').value) || 1;
    const rehab = parseFloat(document.getElementById('pur-rehab').value) || 0;
    
    let totalRent = 0;
    const rentInputs = document.querySelectorAll('.unit-rent-input');
    rentInputs.forEach(input => {
        totalRent += parseFloat(input.value) || 0;
    });

    const resBox = document.getElementById('pur-result-box');
    const errBox = document.getElementById('pur-error');
    const succBox = document.getElementById('pur-success');
    const cfBox = document.getElementById('pur-cashflow-box');
    const warnBox = document.getElementById('pur-warning');
    const stratBox = document.getElementById('pur-strategy');
    const fha100Box = document.getElementById('pur-fha100-view');
    
    if(price <= 0) return alert("Please enter a purchase price.");

    resBox.style.display = 'block';
    errBox.style.display = 'none';
    succBox.style.display = 'none';
    cfBox.style.display = 'none';
    warnBox.style.display = 'none';
    stratBox.style.display = 'none';
    fha100Box.style.display = 'none';

    let basePrice = price + rehab; // Only changes for 203k
    let ltv = +(((basePrice - dp) / basePrice) * 100).toFixed(3);
    
    let baseLoan = basePrice - dp;
    let finalLoan = baseLoan;
    let pmiAmt = 0;
    let pmiNote = "";
    let maxLtv = 100;
    let dpReq = 0;

    // REALITY CHECKS & GUIDELINE EVALUATION
    if(prog === 'conv') { 
        maxLtv = (units === 1) ? 97 : 95; 
        dpReq = basePrice * ((100 - maxLtv) / 100); 
        if(ltv > 80) { pmiAmt = (baseLoan * 0.005)/12; pmiNote = "(Drops off at 20% equity)"; } 
    }
    if(prog === 'conv-sec') { 
        if(units > 1) {
            errBox.style.display = 'block';
            errBox.innerHTML = `Second homes must be 1-unit properties. You cannot purchase a multi-family property as a second home.`;
            return;
        }
        maxLtv = 90; dpReq = basePrice * 0.10; 
        if(ltv > 80) pmiAmt = (baseLoan * 0.005)/12; 
    }
    if(prog === 'conv-inv') { 
        maxLtv = (units === 1) ? 85 : 75; 
        dpReq = basePrice * ((100 - maxLtv) / 100); 
    }
    if(prog === 'dscr') { 
        maxLtv = 80; dpReq = basePrice * 0.20; 
    }
    if(prog === 'fha') { 
        maxLtv = 96.5; 
        dpReq = basePrice * 0.035; 
        if(ltv <= maxLtv) {
            finalLoan = baseLoan + (baseLoan * 0.0175);
            pmiAmt = (baseLoan * 0.005) / 12; 
            pmiNote = "(FHA Monthly MIP)";
        }
    }
    if(prog === 'fha-100') {
        maxLtv = 100; dpReq = 0;
        dp = 0; 
        if(ltv <= maxLtv) {
            let lien1 = basePrice * 0.965;
            let lien2 = basePrice * 0.035;
            finalLoan = lien1 + (lien1 * 0.0175); 
            pmiAmt = (lien1 * 0.005) / 12;
            pmiNote = "(FHA Monthly MIP on 1st Lien)";
            
            stratBox.style.display = 'block';
            stratBox.innerHTML = `🎯 <strong>Strategy Note:</strong> We have adjusted your down payment to $0. This program pairs a 96.5% FHA 1st mortgage with a 3.5% 2nd mortgage.`;
            
            fha100Box.style.display = 'block';
            document.getElementById('fha100-1st').innerText = formatCurrency(finalLoan) + ' (Fees Rolled In)';
            document.getElementById('fha100-2nd').innerText = formatCurrency(lien2);
            
            const pi1 = calcPI(finalLoan, rate, term);
            const pi2 = calcPI(lien2, rate + 2.0, 120); 
            
            document.getElementById('pur-res-loan').innerText = formatCurrency(finalLoan + lien2);
            document.getElementById('pur-res-ltv').innerText = "100%";
            document.getElementById('pur-res-pi').innerHTML = `${formatCurrency(pi1)} <em>(1st)</em> + ${formatCurrency(pi2)} <em>(2nd)</em>`;
            
            const taxIns = (basePrice * 0.015) / 12;
            const total = pi1 + pi2 + pmiAmt + taxIns;
            
            document.getElementById('pur-res-tax').innerText = formatCurrency(taxIns);
            document.getElementById('row-mi').style.display = 'flex';
            document.getElementById('pur-res-mi').innerText = formatCurrency(pmiAmt);
            document.getElementById('pur-res-mi-note').innerText = pmiNote;
            document.getElementById('pur-res-total-pmt').innerText = formatCurrency(total);
            document.getElementById('pur-res-dp').innerText = "$0";
            
            const ccProxy = (finalLoan * 0.025) + 1500;
            document.getElementById('pur-res-cc').innerText = formatCurrency(ccProxy);
            document.getElementById('pur-res-cash').innerText = formatCurrency(ccProxy);
            
            succBox.style.display = 'block';
            return; 
        }
    }
    if(prog === 'homeready') {
        maxLtv = 97; dpReq = basePrice * 0.03;
        if(ltv > 80) { pmiAmt = (baseLoan * 0.0035)/12; pmiNote = "(Reduced MI rates apply)"; }
    }
    if(prog === 'fha-203k') {
        if(rehab < 5000) {
            errBox.style.display = 'block';
            errBox.innerHTML = `FHA 203(k) requires a minimum of $5,000 in eligible repairs. Please adjust your rehab budget.`;
            return;
        }
        maxLtv = 96.5; dpReq = basePrice * 0.035;
        if(ltv <= maxLtv) {
            finalLoan = baseLoan + (baseLoan * 0.0175);
            pmiAmt = (baseLoan * 0.005) / 12;
            pmiNote = "(FHA Monthly MIP)";
        }
    }
    if(prog === 'jumbo') {
        maxLtv = 80; dpReq = basePrice * 0.20;
        if(baseLoan < 766550) { 
            warnBox.style.display = 'block';
            warnBox.innerHTML = `⚠️ <strong>Guideline Alert:</strong> Your loan amount fits within standard conventional limits. You may get better rates by switching to a Conventional strategy.`;
        }
    }
    if(prog === 'alt-doc') {
        maxLtv = 80; dpReq = basePrice * 0.20;
        if(ltv > 80) {
            warnBox.style.display = 'block';
            warnBox.innerHTML = `⚠️ <strong>Guideline Alert:</strong> Alternative income loans (like bank statement loans) typically require a minimum of 20% down. We've adjusted your scenario to reflect 80% LTV.`;
            dp = dpReq;
            baseLoan = basePrice - dp;
            finalLoan = baseLoan;
            ltv = 80;
        }
    }
    if(prog === 'dscr-5-9') {
        maxLtv = 75; dpReq = basePrice * 0.25;
        if(ltv > 75) {
            warnBox.style.display = 'block';
            warnBox.innerHTML = `⚠️ <strong>Guideline Alert:</strong> Commercial 5-9 unit DSCR loans cap at 75% LTV. We've adjusted your down payment to reflect the 25% minimum.`;
            dp = dpReq;
            baseLoan = basePrice - dp;
            finalLoan = baseLoan;
            ltv = 75;
        }
    }
    if(prog === 'va') {
        if(units > 4) {
            errBox.style.display = 'block';
            errBox.innerHTML = `VA loans are capped at 4 units.`;
            return;
        }
        maxLtv = 100;
        dpReq = 0;
        if(ltv <= maxLtv) finalLoan = baseLoan + (baseLoan * 0.0215); 
    }
    if(prog === 'usda') {
        if(units > 1) {
            errBox.style.display = 'block';
            errBox.innerHTML = `USDA loans are only available for 1-unit Single Family properties.`;
            return;
        }
        maxLtv = 100;
        dpReq = 0;
        if(ltv <= maxLtv) {
            finalLoan = baseLoan + (baseLoan * 0.01); 
            pmiAmt = (baseLoan * 0.0035) / 12; 
            pmiNote = "(USDA Annual Fee)";
        }
    }

    // --- STRATEGY PIVOT ---
    if(ltv > maxLtv && prog !== 'alt-doc' && prog !== 'dscr-5-9') {
        errBox.style.display = 'block';
        let errorHtml = `This program requires at least <strong>${100 - maxLtv}% down</strong> for a ${units}-unit property.<br>Based on a $${basePrice} price, your minimum down payment is <strong>${formatCurrency(dpReq)}</strong>.`;
        
        if(occ === 'Investment') {
            errorHtml += `
            <div class="pivot-box">
                <strong style="color:var(--mortgage-blue); font-size:1.1rem;">💡 Not quite enough cash to close?</strong>
                <p style="color:#555; font-size:0.9rem; margin:5px 0 15px 0; font-weight:400;">Have you considered owner-occupying one of the units? Owner-occupying a multi-family property allows you to buy with as little as <strong>3.5% to 5% down</strong> while collecting rent from the other units to pay the mortgage.</p>
                <button onclick="showWizard('wizard-pur-primary')" class="btn-submit" style="font-size:0.8rem; padding: 10px 20px;">Explore Owner-Occupied Options &rarr;</button>
            </div>`;
        }
        
        errBox.innerHTML = errorHtml;
        return;
    }

    // Standard Success Math
    const pi = calcPI(finalLoan, rate, term);
    const taxIns = (basePrice * 0.015) / 12; // 1.5% proxy
    const total = pi + pmiAmt + taxIns;
    const ccProxy = (baseLoan * 0.025) + 1500;

    document.getElementById('pur-res-loan').innerText = formatCurrency(finalLoan) + (finalLoan > baseLoan ? ' (Fees Rolled In)' : '');
    document.getElementById('pur-res-ltv').innerText = ltv.toFixed(2) + "%";
    document.getElementById('pur-res-pi').innerText = formatCurrency(pi);
    document.getElementById('pur-res-tax').innerText = formatCurrency(taxIns);
    
    const miRow = document.getElementById('row-mi');
    if(pmiAmt > 0) {
        miRow.style.display = 'flex';
        document.getElementById('pur-res-mi').innerText = formatCurrency(pmiAmt);
        document.getElementById('pur-res-mi-note').innerText = pmiNote;
    } else {
        miRow.style.display = 'none';
    }

    document.getElementById('pur-res-total-pmt').innerText = formatCurrency(total);
    document.getElementById('pur-res-dp').innerText = formatCurrency(dp);
    document.getElementById('pur-res-cc').innerText = formatCurrency(ccProxy);
    document.getElementById('pur-res-cash').innerText = formatCurrency(dp + ccProxy);

    // Cash Flow / DSCR Logic
    if(totalRent > 0) {
        cfBox.style.display = 'block';
        document.getElementById('pur-cf-rent').innerText = formatCurrency(totalRent);
        document.getElementById('pur-cf-mtg').innerText = formatCurrency(total);
        
        const net = totalRent - total;
        const netEl = document.getElementById('pur-cf-net');
        netEl.innerText = formatCurrency(net);
        netEl.style.color = net >= 0 ? 'var(--success-green)' : 'var(--accent-red)';

        const dscrNote = document.getElementById('pur-cf-dscr-note');
        if(prog === 'dscr' || prog === 'dscr-5-9') {
            const dscrRatio = totalRent / total;
            dscrNote.style.display = 'block';
            
            if (prog === 'dscr-5-9' && dscrRatio < 1.15) {
                dscrNote.innerHTML = `<strong style="color:var(--accent-red);">Your Est. DSCR Ratio is: ${dscrRatio.toFixed(2)}x. This is below the 1.15x minimum required for 5-9 unit properties.</strong><br>You will need to increase your down payment to lower the mortgage payment.`;
            } else {
                dscrNote.innerHTML = `<strong>Your Est. DSCR Ratio is: ${dscrRatio.toFixed(2)}x</strong><br>A ratio of 1.0 means the rent exactly covers the mortgage. Lenders typically prefer 1.20x+ for the best rates.`;
            }
        } else {
            dscrNote.style.display = 'none';
        }
    }

    succBox.style.display = 'block';
}

// --- FIX & FLIP TOOL ---
function openFixFlip() { showWizard('wizard-fix-flip'); }

function runFixFlipMath() {
    const pp = parseFloat(document.getElementById('ff-purchase').value) || 0;
    const rehab = parseFloat(document.getElementById('ff-rehab').value) || 0;
    const arv = parseFloat(document.getElementById('ff-arv').value) || 0;

    if (pp === 0 || rehab === 0 || arv === 0) return alert("Please enter all values.");

    const calc1 = (pp + rehab) * 0.95;
    const calc2 = (pp * 0.90) + rehab;
    const calc3 = arv * 0.75;
    
    const maxLoan = Math.min(calc1, calc2, calc3);
    const baseEq = (pp + rehab) - maxLoan;
    const fees = (maxLoan * 0.0325) + 1625; 
    const titleTax = ((pp / 1000) * 7.5) + (1200 + (maxLoan * 0.0025));

    document.getElementById('ff-breakdown').innerHTML = `
        <li style="${maxLoan === calc1 ? 'font-weight:700; color:var(--mortgage-blue);' : ''}">Calculation 1 (95% Blended LTC): ${formatCurrency(calc1)}</li>
        <li style="${maxLoan === calc2 ? 'font-weight:700; color:var(--mortgage-blue);' : ''}">Calculation 2 (90% Purch + 100% Rehab): ${formatCurrency(calc2)}</li>
        <li style="${maxLoan === calc3 ? 'font-weight:700; color:var(--mortgage-blue);' : ''}">Calculation 3 (75% ARV): ${formatCurrency(calc3)}</li>
    `;
    document.getElementById('ff-max-loan').innerText = formatCurrency(maxLoan);
    document.getElementById('ff-base-equity').innerText = formatCurrency(baseEq);
    document.getElementById('ff-loan-fees').innerText = formatCurrency(fees);
    document.getElementById('ff-title-tax-fees').innerText = formatCurrency(titleTax);
    document.getElementById('ff-cash-to-close').innerText = formatCurrency(baseEq + fees + titleTax + 650);
    
    document.getElementById('ff-result-box').style.display = 'block';
}

// --- REFINANCE WIZARD LOGIC ---
function openRefiCalc(goalId) {
    document.getElementById('refi-active-goal').value = goalId;
    
    const data = refiEduText[goalId];
    document.getElementById('refi-calc-title').innerText = data.title;
    
    let eduHtml = `
        <h3>The Scoop</h3>
        <p>${data.concept}</p>
        <h4>Perfect For:</h4>
        <p>${data.fit}</p>
        <h4>On Your Radar:</h4>
        <ul>
            ${data.radar.map(item => `<li>${item}</li>`).join('')}
        </ul>
    `;
    document.getElementById('refi-calc-edu').innerHTML = eduHtml;
    
    document.getElementById('refi-cash-group').style.display = (goalId === 'co' || goalId === 'he' || goalId === 'equity-adv') ? 'flex' : 'none';
    document.getElementById('he-type-group').style.display = (goalId === 'he') ? 'flex' : 'none';
    document.getElementById('refi-term-group').style.display = (goalId === 'he') ? 'none' : 'flex';

    document.getElementById('refi-result-box').style.display = 'none';
    document.getElementById('refi-success').style.display = 'none';
    document.getElementById('refi-error').style.display = 'none';
    document.getElementById('refi-warning').style.display = 'none';

    showWizard('wizard-refi-calc');
}

function runRefiMath() {
    const goal = document.getElementById('refi-active-goal').value;
    const value = parseFloat(document.getElementById('refi-value').value) || 0;
    const bal = parseFloat(document.getElementById('refi-bal').value) || 0;
    let cash = parseFloat(document.getElementById('refi-cash').value) || 0;
    const rate = parseFloat(document.getElementById('refi-rate').value) || 6.5;
    const term = parseInt(document.getElementById('refi-term').value) || 360;
    
    const resBox = document.getElementById('refi-result-box');
    const errBox = document.getElementById('refi-error');
    const succBox = document.getElementById('refi-success');
    const warnBox = document.getElementById('refi-warning');

    if(value <= 0 || bal <= 0) return alert("Enter home value and current balance.");

    resBox.style.display = 'block';
    errBox.style.display = 'none';
    succBox.style.display = 'none';
    warnBox.style.display = 'none';

    if(goal === 'he' || goal === 'equity-adv') {
        document.getElementById('refi-1st-view').style.display = 'none';
        const heType = (goal === 'equity-adv') ? 'heloan' : document.getElementById('he-type').value;
        let cltv = +(((bal + cash) / value) * 100).toFixed(3);
        
        let maxAllowedLTV = (goal === 'equity-adv') ? 80 : 85;

        if(cltv > maxAllowedLTV) {
            const maxAllowed = (value * (maxAllowedLTV / 100)) - bal;
            
            warnBox.style.display = 'block';
            warnBox.innerHTML = `⚠️ <strong>Guideline Alert:</strong> This secondary lien program caps your Combined LTV at ${maxAllowedLTV}%. We have adjusted your available cash to the maximum allowed.`;
            
            cash = maxAllowed > 0 ? maxAllowed : 0;
            cltv = +(((bal + cash) / value) * 100).toFixed(3);
        }

        if(cash <= 0) {
            errBox.style.display = 'block';
            errBox.innerHTML = `You do not have enough equity to take out a second lien under this program's LTV limits.`;
            return;
        }

        let pmt = 0;
        let typeText = "";
        if(heType === 'heloc') {
            pmt = cash * (rate / 100 / 12); 
            typeText = "HELOC (Interest-Only Draw)";
        } else {
            pmt = calcPI(cash, rate, 180); 
            typeText = "Fixed 2nd Loan (15-Yr Amortized)";
        }

        document.getElementById('r2-loan').innerText = formatCurrency(cash);
        document.getElementById('r2-cltv').innerText = cltv.toFixed(2) + "%";
        document.getElementById('r2-type').innerText = typeText;
        document.getElementById('r2-pmt').innerText = formatCurrency(pmt);
        document.getElementById('refi-2nd-view').style.display = 'block';
        succBox.style.display = 'block';

    } else {
        document.getElementById('refi-2nd-view').style.display = 'none';
        
        let baseTarget = (goal === 'co') ? bal + cash : bal;
        const ccProxy = (baseTarget * 0.015) + 1500;
        const newLoan = baseTarget + ccProxy;
        const ltv = +((newLoan / value) * 100).toFixed(3);
        
        let maxLtv = (goal === 'rt') ? 97 : 80; 
        if(ltv > maxLtv) {
            errBox.style.display = 'block';
            errBox.innerHTML = `LTV exceeds ${maxLtv}% limit.<br>You need more equity to complete this ${goal === 'rt' ? 'Rate/Term' : 'Cash-Out'} refinance.`;
            return;
        }

        const pi = calcPI(newLoan, rate, term);
        document.getElementById('r1-loan').innerText = formatCurrency(newLoan);
        document.getElementById('r1-ltv').innerText = ltv.toFixed(2) + "%";
        document.getElementById('r1-pi').innerText = formatCurrency(pi);
        document.getElementById('r1-total').innerText = formatCurrency(pi);
        
        document.getElementById('refi-1st-view').style.display = 'block';
        succBox.style.display = 'block';
    }
}

// --- SIMPLE PAYMENT CALC ---
function openCalc() { document.getElementById('calcModal').style.display = 'flex'; calculatePayment(); }
function closeCalc() { document.getElementById('calcModal').style.display = 'none'; }
let calcMode = 'purchase';
function switchCalcMode(mode) {
    calcMode = mode;
    document.getElementById('tabPurchase').classList.toggle('active', mode === 'purchase');
    document.getElementById('tabRefi').classList.toggle('active', mode === 'refi');
    document.getElementById('lblAmount').innerText = mode === 'purchase' ? "Home Price ($)" : "Current Balance ($)";
    document.getElementById('lblDown').innerText = mode === 'purchase' ? "Down Payment ($)" : "Cash Out Desired ($)";
    calculatePayment();
}
function calculatePayment() {
    const val1 = parseFloat(document.getElementById('calcPrice').value) || 0; 
    const val2 = parseFloat(document.getElementById('calcDown').value) || 0; 
    const rate = parseFloat(document.getElementById('calcRate').value) || 0;
    const tax = parseFloat(document.getElementById('calcTaxes').value) || 0;
    const ins = parseFloat(document.getElementById('calcIns').value) || 0;
    
    const loanAmount = calcMode === 'purchase' ? val1 - val2 : val1 + val2;
    if (loanAmount > 0 && rate > 0) {
        const total = calcPI(loanAmount, rate, 360) + (tax / 12) + (ins / 12);
        document.getElementById('calcResultDisplay').innerText = formatCurrency(total);
    } else {
        document.getElementById('calcResultDisplay').innerText = "$0";
    }
}

// --- FORMS ---
function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(formData).toString() })
    .then(() => {
        if (form.id === 'quoteForm') {
            form.style.display = 'none';
            document.getElementById('quote-success').style.display = 'block';
        } else {
            alert('Message Sent Successfully!');
            form.reset();
        }
    }).catch(() => alert("Submission failed. Please try again."));
}
