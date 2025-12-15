/**
 * Calculates the estimated monthly Principal & Interest (P&I) payment.
 */
function calculateMortgage() {
    // Get input elements and result container
    const purchasePriceInput = document.getElementById('purchasePrice');
    const downPaymentInput = document.getElementById('downPayment');
    const annualRateInput = document.getElementById('rate');
    const termYearsInput = document.getElementById('term');
    const resultDiv = document.getElementById('mortgageResult');

    // 1. Parse and validate inputs
    const purchasePrice = parseFloat(purchasePriceInput.value);
    const downPayment = parseFloat(downPaymentInput.value);
    const annualRate = parseFloat(annualRateInput.value);
    const termYears = parseFloat(termYearsInput.value);

    // Basic Input Validation
    if (isNaN(purchasePrice) || isNaN(downPayment) || isNaN(annualRate) || isNaN(termYears) || 
        purchasePrice <= 0 || downPayment < 0 || termYears <= 0) {
        resultDiv.innerHTML = '<p class="text-red-400 font-semibold text-center p-3 bg-red-100 rounded-lg">Please ensure all fields are entered with positive, valid numbers.</p>';
        return;
    }

    // Loan Amount Validation
    if (downPayment >= purchasePrice) {
         resultDiv.innerHTML = '<p class="text-red-400 font-semibold text-center p-3 bg-red-100 rounded-lg">Down payment must be less than the purchase price to calculate a loan.</p>';
        return;
    }

    // 2. Calculate loan parameters
    const principal = purchasePrice - downPayment;
    const monthlyRate = (annualRate / 100) / 12; // i
    const totalPayments = termYears * 12; // n

    let monthlyPayment;

    // 3. Apply the mortgage formula
    // M = P [ i(1 + i)^n / ((1 + i)^n - 1) ]
    if (monthlyRate === 0) {
        monthlyPayment = principal / totalPayments;
    } else {
        const compoundFactor = Math.pow((1 + monthlyRate), totalPayments);
        const numerator = monthlyRate * compoundFactor;
        const denominator = compoundFactor - 1;
        monthlyPayment = principal * (numerator / denominator);
    }

    // 4. Format and display the result
    const formattedResult = monthlyPayment.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const formattedPrincipal = principal.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });


    resultDiv.innerHTML = `
        <div class="mt-6 p-5 bg-navy-rhm/95 rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-[1.01]">
            <h3 class="text-white text-lg font-bold mb-3 border-b border-gold-rhm/50 pb-2">Loan Summary</h3>
            
            <p class="text-gold-rhm text-3xl font-extrabold flex justify-between items-center mb-4">
                <span>Monthly P&I:</span>
                <span>${formattedResult}</span>
            </p>
            
            <div class="mt-4 pt-3 text-sm text-gray-300 space-y-1">
                <p class="flex justify-between">
                    <span class="font-semibold">Loan Amount:</span>
                    <span>${formattedPrincipal}</span>
                </p>
                <p class="flex justify-between">
                    <span class="font-semibold">Term:</span>
                    <span>${termYears} Years</span>
                </p>
                <p class="flex justify-between">
                    <span class="font-semibold">Rate:</span>
                    <span>${annualRate}%</span>
                </p>
            </div>

            <p class="text-gray-200 mt-4 text-xs italic text-center opacity-80">
                (This is an estimate for Principal & Interest only and does not include taxes, insurance, or other fees.)
            </p>
        </div>
    `;
}

/**
 * Handles the contact form submission and displays a success message.
 * NOTE: This is a simulation; no actual data is sent.
 */
function showContactMessage(event) {
    event.preventDefault(); 
    const messageDiv = document.getElementById('contactFormMessage');
    
    // Set success style and message
    messageDiv.classList.remove('hidden', 'text-red-500', 'bg-red-100');
    messageDiv.classList.add('text-green-500', 'bg-green-100');
    messageDiv.innerHTML = 'Thank you for your message! We will be in touch shortly.';
    
    // Reset the form fields after successful submission simulation
    event.target.reset();
}

// --- INITIALIZATION CODE ---

// 1. Attach the calculator function to the button click
const calculateBtn = document.getElementById('calculateBtn');
if (calculateBtn) {
    calculateBtn.addEventListener('click', calculateMortgage);
}

// 2. Also attach to input change events for better real-time UX
document.querySelectorAll('#calculator input, #calculator select').forEach(input => {
    input.addEventListener('change', calculateMortgage); 
});

// 3. Run on load to display a result with default values immediately
calculateMortgage();
