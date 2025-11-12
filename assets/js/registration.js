// Registration Form JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Lucide icons
    lucide.createIcons();

    // Get form elements
    const registrationForm = document.getElementById('registrationForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const submitBtn = document.getElementById('submitBtn');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    const stateSelect = document.getElementById('state');
    const lgaSelect = document.getElementById('lga');

    // Multi-step form elements
    let currentStep = 1;
    const totalSteps = 3;
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const step1Indicator = document.getElementById('step1Indicator');
    const step2Indicator = document.getElementById('step2Indicator');
    const step3Indicator = document.getElementById('step3Indicator');
    const progress1 = document.getElementById('progress1');
    const progress2 = document.getElementById('progress2');

    // Function to show specific step
    function showStep(step) {
        // Hide all steps
        step1.classList.add('hidden');
        step2.classList.add('hidden');
        step3.classList.add('hidden');

        // Show current step
        if (step === 1) {
            step1.classList.remove('hidden');
            prevBtn.classList.add('hidden');
            prevBtn.disabled = true;
            nextBtn.classList.remove('hidden');
            nextBtn.disabled = false;
            nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            submitBtn.classList.add('hidden');
            submitBtn.disabled = true;
            updateStepIndicator(1);
        } else if (step === 2) {
            step2.classList.remove('hidden');
            prevBtn.classList.remove('hidden');
            prevBtn.disabled = false;
            prevBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            nextBtn.classList.remove('hidden');
            nextBtn.disabled = false;
            nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            submitBtn.classList.add('hidden');
            submitBtn.disabled = true;
            updateStepIndicator(2);
        } else if (step === 3) {
            step3.classList.remove('hidden');
            prevBtn.classList.remove('hidden');
            prevBtn.disabled = false;
            prevBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            nextBtn.classList.add('hidden');
            nextBtn.disabled = true;
            submitBtn.classList.remove('hidden');
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            updateStepIndicator(3);
        }

        currentStep = step;
        lucide.createIcons(); // Reinitialize icons
    }

    // Function to update step indicator
    function updateStepIndicator(step) {
        // Reset all indicators
        step1Indicator.className = 'step-indicator';
        step2Indicator.className = 'step-indicator';
        step3Indicator.className = 'step-indicator';
        progress1.className = 'progress-line';
        progress2.className = 'progress-line';

        if (step >= 1) {
            step1Indicator.classList.add('step-active');
        } else {
            step1Indicator.classList.add('step-inactive');
        }

        if (step >= 2) {
            step2Indicator.classList.add('step-active');
            progress1.classList.add('progress-active');
        } else {
            step2Indicator.classList.add('step-inactive');
        }

        if (step >= 3) {
            step3Indicator.classList.add('step-active');
            progress2.classList.add('progress-active');
        } else {
            step3Indicator.classList.add('step-inactive');
        }
    }

    // Helper validation functions
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function isValidNigerianPhone(phone) {
        // Remove all spaces and special characters
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        
        // Check if it matches Nigerian phone patterns:
        // 080XXXXXXXX, 081XXXXXXXX, 070XXXXXXXX, 090XXXXXXXX (11 digits)
        // or 234XXXXXXXXXX (13 digits with country code)
        const nigerianPhoneRegex = /^(0[7-9][0-1]\d{8}|234[7-9][0-1]\d{8})$/;
        return nigerianPhoneRegex.test(cleanPhone);
    }

    // Function to validate current step
    function validateStep(step) {
        if (step === 1) {
            const fullName = document.getElementById('fullName').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();

            if (!fullName || !email || !phone) {
                showToast('Please fill in all required fields', 'error');
                return false;
            }

            if (!isValidEmail(email)) {
                showToast('Please enter a valid email address', 'error');
                return false;
            }

            if (!isValidNigerianPhone(phone)) {
                showToast('Please enter a valid Nigerian phone number', 'error');
                return false;
            }

            return true;
        } else if (step === 2) {
            const state = document.getElementById('state').value;
            const lga = document.getElementById('lga').value;

            if (!state || !lga) {
                showToast('Please select both state and LGA', 'error');
                return false;
            }

            return true;
        }

        return true;
    }

    // Next button click handler
    nextBtn.addEventListener('click', function() {
        if (validateStep(currentStep)) {
            if (currentStep < totalSteps) {
                showStep(currentStep + 1);
            }
        }
    });

    // Previous button click handler
    prevBtn.addEventListener('click', function() {
        if (currentStep > 1) {
            showStep(currentStep - 1);
        }
    });

    // Initialize form to show step 1
    showStep(1);

    // Nigerian States and their LGAs data
    const nigerianLGAs = {
        'Abia': ['Aba North', 'Aba South', 'Arochukwu', 'Bende', 'Ikwuano', 'Isiala Ngwa North', 'Isiala Ngwa South', 'Isuikwuato', 'Obi Ngwa', 'Ohafia', 'Osisioma', 'Ugwunagbo', 'Ukwa East', 'Ukwa West', 'Umuahia North', 'Umuahia South', 'Umu Nneochi'],
        'Adamawa': ['Demsa', 'Fufore', 'Ganye', 'Gireri', 'Gombi', 'Guyuk', 'Hong', 'Jada', 'Lamurde', 'Madagali', 'Maiha', 'Mayo Belwa', 'Michika', 'Mubi North', 'Mubi South', 'Numan', 'Shelleng', 'Song', 'Toungo', 'Yola North', 'Yola South'],
        'Akwa Ibom': ['Abak', 'Eastern Obolo', 'Eket', 'Esit Eket', 'Essien Udim', 'Etim Ekpo', 'Etinan', 'Ibeno', 'Ibesikpo Asutan', 'Ibiono Ibom', 'Ika', 'Ikono', 'Ikot Abasi', 'Ikot Ekpene', 'Ini', 'Itu', 'Mbo', 'Mkpat Enin', 'Nsit Atai', 'Nsit Ibom', 'Nsit Ubium', 'Obot Akara', 'Okobo', 'Onna', 'Oron', 'Oruk Anam', 'Udung Uko', 'Ukanafun', 'Uruan', 'Urue Offong/Oruko', 'Uyo'],
        'Anambra': ['Aguata', 'Anambra East', 'Anambra West', 'Anaocha', 'Awka North', 'Awka South', 'Ayamelum', 'Dunukofia', 'Ekwusigo', 'Idemili North', 'Idemili South', 'Ihiala', 'Njikoka', 'Nnewi North', 'Nnewi South', 'Ogbaru', 'Onitsha North', 'Onitsha South', 'Orumba North', 'Orumba South', 'Oyi'],
        'Bauchi': ['Alkaleri', 'Bauchi', 'Bogoro', 'Damban', 'Darazo', 'Dass', 'Gamawa', 'Ganjuwa', 'Giade', 'Itas/Gadau', 'Jama\'are', 'Katagum', 'Kirfi', 'Misau', 'Ningi', 'Shira', 'Tafawa Balewa', 'Toro', 'Warji', 'Zaki'],
        'Bayelsa': ['Brass', 'Ekeremor', 'Kolokuma/Opokuma', 'Nembe', 'Ogbia', 'Sagbama', 'Southern Ijaw', 'Yenagoa'],
        'Benue': ['Ado', 'Agatu', 'Apa', 'Buruku', 'Gboko', 'Guma', 'Gwer East', 'Gwer West', 'Katsina-Ala', 'Konshisha', 'Kwande', 'Logo', 'Makurdi', 'Obi', 'Ogbadibo', 'Ohimini', 'Oju', 'Okpokwu', 'Otukpo', 'Tarka', 'Ukum', 'Ushongo', 'Vandeikya'],
        'Borno': ['Abadam', 'Askira/Uba', 'Bama', 'Bayo', 'Biu', 'Chibok', 'Damboa', 'Dikwa', 'Gubio', 'Guzamala', 'Gwoza', 'Hawul', 'Jere', 'Kaga', 'Kala/Balge', 'Konduga', 'Kukawa', 'Kwaya Kusar', 'Mafa', 'Magumeri', 'Maiduguri', 'Marte', 'Mobbar', 'Monguno', 'Ngala', 'Nganzai', 'Shani'],
        'Cross River': ['Abi', 'Akamkpa', 'Akpabuyo', 'Bakassi', 'Bekwarra', 'Biase', 'Boki', 'Calabar Municipal', 'Calabar South', 'Etung', 'Ikom', 'Obanliku', 'Obubra', 'Obudu', 'Odukpani', 'Ogoja', 'Yakurr', 'Yala'],
        'Delta': ['Aniocha North', 'Aniocha South', 'Bomadi', 'Burutu', 'Ethiope East', 'Ethiope West', 'Ika North East', 'Ika South', 'Isoko North', 'Isoko South', 'Ndokwa East', 'Ndokwa West', 'Okpe', 'Oshimili North', 'Oshimili South', 'Patani', 'Sapele', 'Udu', 'Ughelli North', 'Ughelli South', 'Ukwuani', 'Uvwie', 'Warri North', 'Warri South', 'Warri South West'],
        'Ebonyi': ['Abakaliki', 'Afikpo North', 'Afikpo South', 'Ebonyi', 'Ezza North', 'Ezza South', 'Ikwo', 'Ishielu', 'Ivo', 'Izzi', 'Ohaozara', 'Ohaukwu', 'Onicha'],
        'Edo': ['Akoko-Edo', 'Egor', 'Esan Central', 'Esan North-East', 'Esan South-East', 'Esan West', 'Etsako Central', 'Etsako East', 'Etsako West', 'Igueben', 'Ikpoba-Okha', 'Oredo', 'Orhionmwon', 'Ovia North-East', 'Ovia South-West', 'Owan East', 'Owan West', 'Uhunmwonde'],
        'Ekiti': ['Ado Ekiti', 'Efon', 'Ekiti East', 'Ekiti South-West', 'Ekiti West', 'Emure', 'Gbonyin', 'Ido Osi', 'Ijero', 'Ikere', 'Ikole', 'Ilejemeje', 'Irepodun/Ifelodun', 'Ise/Orun', 'Moba', 'Oye'],
        'Enugu': ['Aninri', 'Awgu', 'Enugu East', 'Enugu North', 'Enugu South', 'Ezeagu', 'Igbo Etiti', 'Igbo Eze North', 'Igbo Eze South', 'Isi Uzo', 'Nkanu East', 'Nkanu West', 'Nsukka', 'Oji River', 'Udenu', 'Udi', 'Uzo Uwani'],
        'FCT': ['Abaji', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali', 'Municipal Area Council'],
        'Gombe': ['Akko', 'Balanga', 'Billiri', 'Dukku', 'Funakaye', 'Gombe', 'Kaltungo', 'Kwami', 'Nafada', 'Shongom', 'Yamaltu/Deba'],
        'Imo': ['Aboh Mbaise', 'Ahiazu Mbaise', 'Ehime Mbano', 'Ezinihitte', 'Ideato North', 'Ideato South', 'Ihitte/Uboma', 'Ikeduru', 'Isiala Mbano', 'Isu', 'Mbaitoli', 'Ngor Okpala', 'Njaba', 'Nkwerre', 'Nwangele', 'Obowo', 'Oguta', 'Ohaji/Egbema', 'Okigwe', 'Onuimo', 'Orlu', 'Orsu', 'Oru East', 'Oru West', 'Owerri Municipal', 'Owerri North', 'Owerri West'],
        'Jigawa': ['Auyo', 'Babura', 'Biriniwa', 'Birnin Kudu', 'Buji', 'Dutse', 'Gagarawa', 'Garki', 'Gumel', 'Guri', 'Gwaram', 'Gwiwa', 'Hadejia', 'Jahun', 'Kafin Hausa', 'Kaugama', 'Kazaure', 'Kiri Kasama', 'Kiyawa', 'Maigatari', 'Malam Madori', 'Miga', 'Ringim', 'Roni', 'Sule Tankarkar', 'Taura', 'Yankwashi'],
        'Kaduna': ['Birnin Gwari', 'Chikun', 'Giwa', 'Igabi', 'Ikara', 'Jaba', 'Jema\'a', 'Kachia', 'Kaduna North', 'Kaduna South', 'Kagarko', 'Kajuru', 'Kaura', 'Kauru', 'Kubau', 'Kudan', 'Lere', 'Makarfi', 'Sabon Gari', 'Sanga', 'Soba', 'Zangon Kataf', 'Zaria'],
        'Kano': ['Ajingi', 'Albasu', 'Bagwai', 'Bebeji', 'Bichi', 'Bunkure', 'Dala', 'Dambatta', 'Dawakin Kudu', 'Dawakin Tofa', 'Doguwa', 'Fagge', 'Gabasawa', 'Garko', 'Garun Mallam', 'Gaya', 'Gezawa', 'Gwale', 'Gwarzo', 'Kabo', 'Kano Municipal', 'Karaye', 'Kibiya', 'Kiru', 'Kumbotso', 'Kunchi', 'Kura', 'Madobi', 'Makoda', 'Minjibir', 'Nasarawa', 'Rano', 'Rimin Gado', 'Rogo', 'Shanono', 'Sumaila', 'Takai', 'Tarauni', 'Tofa', 'Tsanyawa', 'Tudun Wada', 'Ungogo', 'Warawa', 'Wudil'],
        'Katsina': ['Bakori', 'Batagarawa', 'Batsari', 'Baure', 'Bindawa', 'Charanchi', 'Dan Musa', 'Dandume', 'Danja', 'Daura', 'Dutsi', 'Dutsin Ma', 'Faskari', 'Funtua', 'Ingawa', 'Jibia', 'Kafur', 'Kaita', 'Kankara', 'Kankia', 'Katsina', 'Kurfi', 'Kusada', 'Mai\'Adua', 'Malumfashi', 'Mani', 'Mashi', 'Matazu', 'Musawa', 'Rimi', 'Sabuwa', 'Safana', 'Sandamu', 'Zango'],
        'Kebbi': ['Aleiro', 'Arewa Dandi', 'Argungu', 'Augie', 'Bagudo', 'Birnin Kebbi', 'Bunza', 'Dandi', 'Fakai', 'Gwandu', 'Jega', 'Kalgo', 'Koko/Besse', 'Maiyama', 'Ngaski', 'Sakaba', 'Shanga', 'Suru', 'Wasagu/Danko', 'Yauri', 'Zuru'],
        'Kogi': ['Adavi', 'Ajaokuta', 'Ankpa', 'Bassa', 'Dekina', 'Ibaji', 'Idah', 'Igalamela-Odolu', 'Ijumu', 'Kabba/Bunu', 'Kogi', 'Lokoja', 'Mopa-Muro', 'Ofu', 'Ogori/Magongo', 'Okehi', 'Okene', 'Olamaboro', 'Omala', 'Yagba East', 'Yagba West'],
        'Kwara': ['Asa', 'Baruten', 'Edu', 'Ekiti', 'Ifelodun', 'Ilorin East', 'Ilorin South', 'Ilorin West', 'Irepodun', 'Isin', 'Kaiama', 'Moro', 'Offa', 'Oke Ero', 'Oyun', 'Pategi'],
        'Lagos': ['Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa', 'Badagry', 'Epe', 'Eti Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye', 'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Lagos Mainland', 'Mushin', 'Ojo', 'Oshodi-Isolo', 'Shomolu', 'Surulere'],
        'Nasarawa': ['Akwanga', 'Awe', 'Doma', 'Karu', 'Keana', 'Keffi', 'Kokona', 'Lafia', 'Nasarawa', 'Nasarawa Egon', 'Obi', 'Toto', 'Wamba'],
        'Niger': ['Agaie', 'Agwara', 'Bida', 'Borgu', 'Bosso', 'Chanchaga', 'Edati', 'Gbako', 'Gurara', 'Katcha', 'Kontagora', 'Lapai', 'Lavun', 'Magama', 'Mariga', 'Mashegu', 'Mokwa', 'Muya', 'Paikoro', 'Rafi', 'Rijau', 'Shiroro', 'Suleja', 'Tafa', 'Wushishi'],
        'Ogun': ['Abeokuta North', 'Abeokuta South', 'Ado-Odo/Ota', 'Egbado North', 'Egbado South', 'Ewekoro', 'Ifo', 'Ijebu East', 'Ijebu North', 'Ijebu North East', 'Ijebu Ode', 'Ikenne', 'Imeko Afon', 'Ipokia', 'Obafemi Owode', 'Odeda', 'Odogbolu', 'Ogun Waterside', 'Remo North', 'Sagamu'],
        'Ondo': ['Akoko North East', 'Akoko North West', 'Akoko South East', 'Akoko South West', 'Akure North', 'Akure South', 'Ese Odo', 'Idanre', 'Ifedore', 'Ilaje', 'Ile Oluji/Okeigbo', 'Irele', 'Odigbo', 'Okitipupa', 'Ondo East', 'Ondo West', 'Ose', 'Owo'],
        'Osun': ['Aiyedaade', 'Aiyedire', 'Atakunmosa East', 'Atakunmosa West', 'Boluwaduro', 'Boripe', 'Ede North', 'Ede South', 'Egbedore', 'Ejigbo', 'Ife Central', 'Ife East', 'Ife North', 'Ife South', 'Ifedayo', 'Ifelodun', 'Ila', 'Ilesha East', 'Ilesha West', 'Irepodun', 'Irewole', 'Isokan', 'Iwo', 'Obokun', 'Odo Otin', 'Ola Oluwa', 'Olorunda', 'Oriade', 'Orolu', 'Osogbo'],
        'Oyo': ['Afijio', 'Akinyele', 'Atiba', 'Atisbo', 'Egbeda', 'Ibadan Central', 'Ibadan North', 'Ibadan North West', 'Ibadan South East', 'Ibadan South West', 'Ibarapa Central', 'Ibarapa East', 'Ibarapa North', 'Ido', 'Irepo', 'Iseyin', 'Itesiwaju', 'Iwajowa', 'Kajola', 'Lagelu', 'Ogbomosho North', 'Ogbomosho South', 'Ogo Oluwa', 'Olorunsogo', 'Oluyole', 'Ona Ara', 'Orelope', 'Ori Ire', 'Oyo East', 'Oyo West', 'Saki East', 'Saki West', 'Surulere'],
        'Plateau': ['Barkin Ladi', 'Bassa', 'Bokkos', 'Jos East', 'Jos North', 'Jos South', 'Kanam', 'Kanke', 'Langtang North', 'Langtang South', 'Mangu', 'Mikang', 'Pankshin', 'Qua\'an Pan', 'Riyom', 'Shendam', 'Wase'],
        'Rivers': ['Abua/Odual', 'Ahoada East', 'Ahoada West', 'Akuku-Toru', 'Andoni', 'Asari-Toru', 'Bonny', 'Degema', 'Eleme', 'Emohua', 'Etche', 'Gokana', 'Ikwerre', 'Khana', 'Obio/Akpor', 'Ogba/Egbema/Ndoni', 'Ogu/Bolo', 'Okrika', 'Omuma', 'Opobo/Nkoro', 'Oyigbo', 'Port Harcourt', 'Tai'],
        'Sokoto': ['Binji', 'Bodinga', 'Dange Shuni', 'Gada', 'Goronyo', 'Gudu', 'Gwadabawa', 'Illela', 'Isa', 'Kebbe', 'Kware', 'Rabah', 'Sabon Birni', 'Shagari', 'Silame', 'Sokoto North', 'Sokoto South', 'Tambuwal', 'Tangaza', 'Tureta', 'Wamako', 'Wurno', 'Yabo'],
        'Taraba': ['Ardo Kola', 'Bali', 'Donga', 'Gashaka', 'Gassol', 'Ibi', 'Jalingo', 'Karim Lamido', 'Kurmi', 'Lau', 'Sardauna', 'Takum', 'Ussa', 'Wukari', 'Yorro', 'Zing'],
        'Yobe': ['Bade', 'Bursari', 'Damaturu', 'Fika', 'Fune', 'Geidam', 'Gujba', 'Gulani', 'Jakusko', 'Karasuwa', 'Karawa', 'Machina', 'Nangere', 'Nguru', 'Potiskum', 'Tarmuwa', 'Yunusari', 'Yusufari'],
        'Zamfara': ['Anka', 'Bakura', 'Birnin Magaji/Kiyaw', 'Bukkuyum', 'Bungudu', 'Gummi', 'Gusau', 'Kaura Namoda', 'Maradun', 'Maru', 'Shinkafi', 'Talata Mafara', 'Zurmi']
    };

    // Password visibility toggle
    let passwordVisible = false;
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function() {
            passwordVisible = !passwordVisible;
            passwordInput.type = passwordVisible ? 'text' : 'password';

            const icon = togglePasswordBtn.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', passwordVisible ? 'eye-off' : 'eye');
                lucide.createIcons();
            }
        });
    }

    // Real-time password strength checking
    passwordInput.addEventListener('input', function() {
        checkPasswordStrength(this.value);
    });

    // Phone number formatting for Nigerian numbers
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits

        // Handle different Nigerian phone formats
        if (value.startsWith('234')) {
            // International format: 234XXXXXXXXXX
            // Keep as is, just format with spaces for readability
            if (value.length <= 13) {
                value = value.replace(/(\d{3})(\d{1,3})?(\d{1,3})?(\d{1,4})?/, function(match, p1, p2, p3, p4) {
                    let result = p1;
                    if (p2) result += ' ' + p2;
                    if (p3) result += ' ' + p3;
                    if (p4) result += ' ' + p4;
                    return result.trim();
                });
            }
        } else if (value.startsWith('0')) {
            // Local format: 0XXXXXXXXXX
            // Keep in this format (backend accepts it)
            if (value.length <= 11) {
                value = value.replace(/(\d{4})(\d{1,3})?(\d{1,4})?/, function(match, p1, p2, p3) {
                    let result = p1;
                    if (p2) result += ' ' + p2;
                    if (p3) result += ' ' + p3;
                    return result.trim();
                });
            }
        } else if (value.length > 0) {
            // No prefix, assume local - add leading 0
            value = '0' + value;
            if (value.length <= 11) {
                value = value.replace(/(\d{4})(\d{1,3})?(\d{1,4})?/, function(match, p1, p2, p3) {
                    let result = p1;
                    if (p2) result += ' ' + p2;
                    if (p3) result += ' ' + p3;
                    return result.trim();
                });
            }
        }

        e.target.value = value;
    });

    // Email validation
    emailInput.addEventListener('blur', function() {
        validateEmail(this.value);
    });

    // State change handler for LGA population
    stateSelect.addEventListener('change', function() {
        populateLGAOptions(this.value);
    });

    // Form submission
    registrationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleRegistration();
    });

    // Password strength checker
    function checkPasswordStrength(password) {
        const strengthBar = document.getElementById('passwordStrengthBar');
        const strengthText = document.getElementById('passwordStrengthText');

        let strength = 0;
        let feedback = [];

        // Length check
        if (password.length >= 8) {
            strength += 25;
        } else {
            feedback.push('At least 8 characters');
        }

        // Lowercase check
        if (/[a-z]/.test(password)) {
            strength += 25;
        } else {
            feedback.push('Lowercase letter');
        }

        // Uppercase check
        if (/[A-Z]/.test(password)) {
            strength += 25;
        } else {
            feedback.push('Uppercase letter');
        }

        // Number check
        if (/\d/.test(password)) {
            strength += 25;
        } else {
            feedback.push('Number');
        }

        // Update UI
        strengthBar.style.width = strength + '%';
        strengthBar.className = 'h-full password-strength transition-all duration-300';

        if (strength < 50) {
            strengthBar.classList.add('weak');
            strengthText.textContent = 'Weak';
            strengthText.style.color = '#ef4444';
        } else if (strength < 75) {
            strengthBar.classList.add('medium');
            strengthText.textContent = 'Medium';
            strengthText.style.color = '#f59e0b';
        } else {
            strengthBar.classList.add('strong');
            strengthText.textContent = 'Strong';
            strengthText.style.color = '#10b981';
        }
    }

    // Email validation
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Phone validation for Nigerian numbers
    function validatePhone(phone) {
        // Remove spaces and check if it's a valid Nigerian number
        const cleanPhone = phone.replace(/\s/g, '');
        
        // Backend accepts: +234 or 0, followed by [7,8,9], then [0,1], then 8 digits
        // Examples: +2348012345678, 08012345678, 2348012345678
        const nigerianRegex = /^(\+234|234|0)[789][01]\d{8}$/;
        return nigerianRegex.test(cleanPhone);
    }

    // Populate LGA options based on selected state
    function populateLGAOptions(state) {
        const lgaSelect = document.getElementById('lga');

        // Clear existing options
        lgaSelect.innerHTML = '<option value="">Select your LGA</option>';

        if (state && nigerianLGAs[state]) {
            // Enable LGA dropdown
            lgaSelect.disabled = false;

            // Add LGA options
            nigerianLGAs[state].forEach(lga => {
                const option = document.createElement('option');
                option.value = lga;
                option.textContent = lga;
                lgaSelect.appendChild(option);
            });
        } else {
            // Disable LGA dropdown if no state selected
            lgaSelect.disabled = true;
            lgaSelect.innerHTML = '<option value="">Select your state first</option>';
        }

        // Re-render icons
        setTimeout(() => {
            lucide.createIcons();
        }, 100);
    }

    // Registration handler
    async function handleRegistration() {
        const formData = new FormData(registrationForm);
        const userData = {
            fullName: formData.get('fullName').trim(),
            email: formData.get('email').trim().toLowerCase(),
            phone: formData.get('phone').replace(/\s/g, ''), // Remove spaces
            state: formData.get('state'),
            lga: formData.get('lga'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
            terms: formData.get('terms') === 'on'
        };

        // Convert state name to backend format (lowercase with underscores)
        // e.g., "Cross River" -> "cross_river", "Federal Capital Territory" -> "fct"
        const stateMapping = {
            'Abia': 'abia',
            'Adamawa': 'adamawa',
            'Akwa Ibom': 'akwa_ibom',
            'Anambra': 'anambra',
            'Bauchi': 'bauchi',
            'Bayelsa': 'bayelsa',
            'Benue': 'benue',
            'Borno': 'borno',
            'Cross River': 'cross_river',
            'Delta': 'delta',
            'Ebonyi': 'ebonyi',
            'Edo': 'edo',
            'Ekiti': 'ekiti',
            'Enugu': 'enugu',
            'FCT': 'fct',
            'Gombe': 'gombe',
            'Imo': 'imo',
            'Jigawa': 'jigawa',
            'Kaduna': 'kaduna',
            'Kano': 'kano',
            'Katsina': 'katsina',
            'Kebbi': 'kebbi',
            'Kogi': 'kogi',
            'Kwara': 'kwara',
            'Lagos': 'lagos',
            'Nasarawa': 'nasarawa',
            'Niger': 'niger',
            'Ogun': 'ogun',
            'Ondo': 'ondo',
            'Osun': 'osun',
            'Oyo': 'oyo',
            'Plateau': 'plateau',
            'Rivers': 'rivers',
            'Sokoto': 'sokoto',
            'Taraba': 'taraba',
            'Yobe': 'yobe',
            'Zamfara': 'zamfara'
        };

        // Convert state to backend format
        userData.state = stateMapping[userData.state] || userData.state.toLowerCase().replace(/\s+/g, '_');

        // Validation
        let errors = [];

        // Full name validation
        if (!userData.fullName || userData.fullName.length < 2) {
            errors.push('Full name must be at least 2 characters long');
        }

        // Email validation
        if (!validateEmail(userData.email)) {
            errors.push('Please enter a valid email address');
        }

        // Phone validation
        if (!validatePhone(userData.phone)) {
            errors.push('Please enter a valid Nigerian phone number');
        }

        // State validation
        if (!userData.state) {
            errors.push('Please select your state');
        }

        // LGA validation
        if (!userData.lga) {
            errors.push('Please select your Local Government Area (LGA)');
        }

        // Password validation
        if (userData.password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!/[a-z]/.test(userData.password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/[A-Z]/.test(userData.password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/\d/.test(userData.password)) {
            errors.push('Password must contain at least one number');
        }

        // Confirm password
        if (userData.password !== userData.confirmPassword) {
            errors.push('Passwords do not match');
        }

        // Terms validation
        if (!userData.terms) {
            errors.push('You must agree to the Terms of Service and Privacy Policy');
        }

        // Show errors or proceed
        if (errors.length > 0) {
            showToast(errors[0], 'error');
            return;
        }

        // Disable submit button and remove disabled styling
        submitBtn.disabled = true;
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        submitBtn.querySelector('span').textContent = 'Creating Account...';

        try {
            // Normalize phone number for backend
            // Backend expects: (\+234|0)[789][01]\d{8}
            // Convert any format to 0XXXXXXXXXX format
            let normalizedPhone = userData.phone.replace(/\s/g, ''); // Remove spaces
            
            // Handle different input formats
            if (normalizedPhone.startsWith('+234')) {
                normalizedPhone = '0' + normalizedPhone.substring(4); // +2348012345678 -> 08012345678
            } else if (normalizedPhone.startsWith('234')) {
                normalizedPhone = '0' + normalizedPhone.substring(3); // 2348012345678 -> 08012345678
            }
            // If it already starts with 0, keep it as is
            
            console.log('Sending phone number:', normalizedPhone); // Debug log

            // Call backend API to register user
            const response = await api.post(API_CONFIG.ENDPOINTS.REGISTER, {
                full_name: userData.fullName,
                email: userData.email,
                phone_number: normalizedPhone,
                state: userData.state,
                city: userData.lga, // Backend uses 'city' field for LGA
                password: userData.password,
                password_confirm: userData.confirmPassword
            }, false); // false means no auth token needed for registration

            // Auto-login after successful registration
            try {
                // Login with the newly created credentials
                const loginResponse = await api.post(API_CONFIG.ENDPOINTS.LOGIN, {
                    email: userData.email,
                    password: userData.password
                }, false);

                // Store tokens and user data
                api.setTokens(loginResponse.access, loginResponse.refresh);
                api.setCurrentUser(loginResponse.user);

                // Show success modal with countdown
                showSuccessModal();

            } catch (loginError) {
                console.error('Auto-login error:', loginError);
                // If auto-login fails, show success message and redirect to login
                showToast('Account created! Please login.', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }

        } catch (error) {
            console.error('Registration error:', error);
            console.log('Error details:', JSON.stringify(error, null, 2));
            
            // Handle different error types
            let errorMessage = 'An error occurred during registration. Please try again.';
            
            if (error.status && error.errors) {
                // API returned an error response (from api.js)
                if (error.status === 400) {
                    // Handle field-specific errors
                    const data = error.errors;
                    if (data.email) {
                        errorMessage = Array.isArray(data.email) ? data.email[0] : data.email;
                    } else if (data.phone_number) {
                        errorMessage = Array.isArray(data.phone_number) ? data.phone_number[0] : data.phone_number;
                    } else if (data.password) {
                        errorMessage = Array.isArray(data.password) ? data.password[0] : data.password;
                    } else if (data.detail) {
                        errorMessage = data.detail;
                    } else if (data.non_field_errors) {
                        errorMessage = data.non_field_errors[0];
                    } else {
                        // Show first error message from any field
                        const firstError = Object.values(data)[0];
                        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
                    }
                } else if (error.message) {
                    errorMessage = error.message;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            showToast(errorMessage, 'error');
            
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
            submitBtn.querySelector('span').textContent = 'Create Account';
        }
    }

    // Toast notification system
    function showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transform translate-x-full transition-all duration-300 max-w-sm ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            type === 'warning' ? 'bg-yellow-500 text-white' :
            'bg-blue-500 text-white'
        }`;

        const iconName = type === 'success' ? 'check-circle' :
                        type === 'error' ? 'x-circle' :
                        type === 'warning' ? 'alert-triangle' : 'info';

        toast.innerHTML = `
            <i data-lucide="${iconName}" class="h-5 w-5 flex-shrink-0"></i>
            <span class="text-sm font-medium">${message}</span>
        `;

        toastContainer.appendChild(toast);

        // Trigger animation
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 10);

        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);

        // Re-render icons
        setTimeout(() => {
            lucide.createIcons();
        }, 100);
    }

    // Success Modal with Countdown and Auto-Redirect
    function showSuccessModal() {
        const modal = document.getElementById('successModal');
        const countdown = document.getElementById('countdown');
        const progressBar = document.getElementById('progressBar');
        
        if (!modal) return;

        // Show modal
        modal.classList.remove('hidden');

        let timeLeft = 5; // 5 seconds countdown
        const totalTime = 5;

        // Update countdown and progress bar every second
        const countdownInterval = setInterval(() => {
            timeLeft--;
            
            // Update countdown text
            if (countdown) {
                countdown.textContent = timeLeft;
            }

            // Update progress bar
            if (progressBar) {
                const progress = ((totalTime - timeLeft) / totalTime) * 100;
                progressBar.style.width = `${progress}%`;
            }

            // Redirect when countdown reaches 0
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                window.location.href = 'shop-list.html';
            }
        }, 1000);

        // Start progress bar animation immediately
        if (progressBar) {
            progressBar.style.width = '0%';
        }
    }

    // Initialize password strength on page load
    checkPasswordStrength(passwordInput.value);
});