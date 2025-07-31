// استيراد مكتبات Firebase (إصدار 10.12.5)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// **إعدادات Firebase الخاصة بمشروعك "aman-safety"**
const firebaseConfig = {
  apiKey: "AIzaSyBRMKKR7URejme05AJ9-ufnj9Ehcg67Pfg",
  authDomain: "aman-safety.firebaseapp.com",
  projectId: "aman-safety",
  messagingSenderId: "16880858",
  appId: "1:168805958858:web:bccc84abcf58a180132033",
  measurementId: "G-N6DDZ6N7GW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUserId = null;
let isDarkMode = false;
let productId = null; // معرّف المنتج الذي سيتم عرضه

// عناصر DOM الرئيسية (للتيم والمودال)
let modeToggleButton;
let modeToggleIcon;
let userIdDisplay;
let universalModal;
let modalTitle;
let modalContent;
let modalActions;
let loadingIndicator;

// عناصر DOM لصفحة خطاب المبيعات الجديدة
let productSalesLetterContent; // العنصر الرئيسي للمحتوى الجديد
let loadingMessage;
let errorMessage;
let goToHomePageButton;

// عناصر قسم البطل (Hero Section)
let salesLetterProductName;
let salesLetterProductSlogan; // ثابت في HTML حالياً
let salesLetterMainImage;
let salesLetterShortDescription;
let addToCartButton; // زر أضف إلى السلة الأول
let viewProductDetailsButton; // زر مشاهدة المنتج عن قرب

// عناصر الأقسام الجديدة
let materialsAndDimensionsSection;
let materialsAndDimensionsContent;
let technologiesSection;
let technologiesContent;
let warrantyAndServiceSection;
let warrantyAndServiceContent;
let finalAddToCartButton; // زر أضف إلى السلة النهائي

// دوال النافذة المنبثقة العامة (Universal Modal) - تبقى كما هي
function openModal(title, message, buttons = [], is_loading = false) {
    if (!modalTitle || !modalContent || !modalActions || !loadingIndicator || !universalModal) {
        console.error("Modal elements not found. Cannot open modal.");
        return;
    }
    modalTitle.textContent = title;
    modalContent.innerHTML = message;
    modalActions.innerHTML = '';
    buttons.forEach(btn => {
        const buttonElement = document.createElement('button');
        buttonElement.textContent = btn.text;
        buttonElement.className = `py-2 px-4 rounded font-bold ${btn.className || 'bg-gray-300 text-gray-800 hover:bg-gray-400'}`;
        buttonElement.onclick = () => { btn.onClick(); };
        modalActions.appendChild(buttonElement);
    });
    if (is_loading) {
        loadingIndicator.classList.remove('hidden');
        modalActions.classList.add('hidden');
    } else {
        loadingIndicator.classList.add('hidden');
        modalActions.classList.remove('hidden');
    }
    universalModal.classList.add('active');
    document.body.classList.add('no-scroll');
}

function closeModal() {
    if (!universalModal || !modalTitle || !modalContent || !modalActions || !loadingIndicator) {
        console.error("Modal elements not found. Cannot close modal.");
        return;
    }
    universalModal.classList.remove('active');
    document.body.classList.remove('no-scroll');
    modalTitle.textContent = '';
    modalContent.innerHTML = '';
    modalActions.innerHTML = '';
    loadingIndicator.classList.add('hidden');
}

// دوال الثيم (الوضع الليلي/النهاري) - تبقى كما هي
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('darkMode', isDarkMode);
    applyTheme();
}

function applyTheme() {
    if (!document.body || !modeToggleIcon) { // أزلنا menuDropdownIcon من هنا لأنه ليس رئيسياً لتطبيق الثيم العام
        console.warn("Critical header elements not found for theme application. Retrying in 50ms.");
        setTimeout(applyTheme, 50);
        return;
    }
    document.body.classList.toggle('dark-mode', isDarkMode);
    modeToggleIcon.textContent = isDarkMode ? 'dark_mode' : 'light_mode';

    const headerIcons = document.querySelectorAll('header .material-symbols-outlined');
    headerIcons.forEach(icon => {
        if (icon && icon.id !== 'modeToggleIcon') {
            icon.style.color = isDarkMode ? 'var(--light-red)' : 'var(--primary-red)';
        }
    });

    const dropdownItems = document.querySelectorAll('#menuDropdown a .material-symbols-outlined');
    dropdownItems.forEach(icon => {
        if (icon) {
            icon.style.color = isDarkMode ? 'var(--light-red)' : 'var(--primary-red)';
        }
    });
}

// ** الدوال الجديدة والمعدلة لعرض تفاصيل المنتج بأسلوب خطاب المبيعات **

// دالة لجلب وعرض تفاصيل المنتج
async function fetchAndDisplayProductDetails(productId) {
    if (!currentUserId || !productId) {
        errorMessage.classList.remove('hidden');
        loadingMessage.classList.add('hidden');
        productSalesLetterContent.classList.add('hidden');
        return;
    }

    loadingMessage.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    productSalesLetterContent.classList.add('hidden'); // إخفاء المحتوى الجديد بالكامل

    try {
        // جلب معلومات المنتج الأساسية من مجموعة 'products'
        const productDocRef = doc(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/products`, productId);
        const productSnap = await getDoc(productDocRef);

        if (!productSnap.exists()) {
            errorMessage.classList.remove('hidden');
            loadingMessage.classList.add('hidden');
            return;
        }

        const productData = productSnap.data();
        
        // جلب الأقسام الديناميكية من مجموعة 'productDetails'
        const dynamicDetailsDocRef = doc(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/productDetails`, productId);
        const dynamicDetailsSnap = await getDoc(dynamicDetailsDocRef);
        const dynamicSections = dynamicDetailsSnap.exists() ? dynamicDetailsSnap.data().sections || [] : [];

        // عرض المعلومات الأساسية في قسم البطل (Hero Section)
        salesLetterProductName.textContent = productData.name || 'منتج لا مثيل له';
        salesLetterMainImage.src = productData.imageUrl || 'placeholder.png';
        salesLetterShortDescription.innerHTML = `<p>${productData.description || 'لا يوجد وصف مقنع بعد، ولكن هذا المنتج سيغير حياتك!'}</p>`;
        
        // ----- تعبئة القسم الأول: المادة والقياسات والشكل -----
        const materialSection = dynamicSections.find(s => s.type === 'info_card' && s.title?.includes('المادة والقياسات والشكل')); // افتراض أن العنوان قد يشمل هذا
        if (materialSection && materialSection.items && materialSection.items.length > 0) {
            materialsAndDimensionsContent.innerHTML = ''; // مسح المحتوى القديم
            materialSection.items.forEach(item => {
                if (item.key && item.value) {
                    materialsAndDimensionsContent.innerHTML += `
                        <div class="viewer-info-item">
                            <span class="key">${item.key}:</span>
                            <span class="value">${item.value}</span>
                        </div>
                    `;
                }
            });
            materialsAndDimensionsSection.classList.remove('hidden');
        } else {
            // يمكن إضافة محتوى افتراضي أو إخفاء القسم إذا لم تتوفر بيانات
            materialsAndDimensionsSection.classList.add('hidden'); // إخفاء القسم بالكامل
        }

        // ----- تعبئة القسم الثاني: التقنيات المستخدمة -----
        const technologiesSectionData = dynamicSections.find(s => s.type === 'description' && s.title?.includes('التقنيات المستخدمة')) || 
                                       dynamicSections.find(s => s.type === 'info_card' && s.title?.includes('التقنيات المستخدمة'));
        if (technologiesSectionData) {
            technologiesContent.innerHTML = ''; // مسح المحتوى القديم
            if (technologiesSectionData.type === 'description' && technologiesSectionData.lines) {
                technologiesSectionData.lines.forEach(line => {
                    if (line.content && line.content.trim() !== '') {
                        if (line.type === 'heading') {
                            technologiesContent.innerHTML += `<h4 class="description-line-heading">${line.content}</h4>`;
                        } else if (line.type === 'highlight') {
                            technologiesContent.innerHTML += `<p class="description-line-highlight">${line.content}</p>`;
                        } else { // paragraph
                            technologiesContent.innerHTML += `<p>${line.content}</p>`;
                        }
                    }
                });
            } else if (technologiesSectionData.type === 'info_card' && technologiesSectionData.items) {
                 technologiesSectionData.items.forEach(item => {
                    if (item.key && item.value) {
                        technologiesContent.innerHTML += `
                            <div class="viewer-info-item">
                                <span class="key">${item.key}:</span>
                                <span class="value">${item.value}</span>
                            </div>
                        `;
                    }
                });
            } else {
                 technologiesContent.innerHTML = `<p class="text-gray-500 dark:text-gray-400">لا توجد تفاصيل عن التقنيات المستخدمة.</p>`;
            }
            technologiesSection.classList.remove('hidden');
        } else {
            technologiesSection.classList.add('hidden'); // إخفاء القسم بالكامل
        }
        
        // ----- تعبئة القسم الرابع: الضمان وخدمة ما بعد البيع -----
        const warrantySectionData = dynamicSections.find(s => s.type === 'info_card' && s.title?.includes('الضمان وخدمة ما بعد البيع'));
        if (warrantySectionData && warrantySectionData.items && warrantySectionData.items.length > 0) {
            warrantyAndServiceContent.innerHTML = ''; // مسح المحتوى القديم
            warrantySectionData.items.forEach(item => {
                if (item.key && item.value) {
                    warrantyAndServiceContent.innerHTML += `
                        <div class="viewer-info-item">
                            <span class="key">${item.key}:</span>
                            <span class="value">${item.value}</span>
                        </div>
                    `;
                }
            });
            warrantyAndServiceSection.classList.remove('hidden');
        } else {
            warrantyAndServiceSection.classList.add('hidden'); // إخفاء القسم بالكامل
        }

        loadingMessage.classList.add('hidden');
        productSalesLetterContent.classList.remove('hidden'); // إظهار المحتوى بعد التحميل
        applyTheme(); // تطبيق الثيم على العناصر الجديدة
        
    } catch (error) {
        console.error("خطأ في جلب أو عرض تفاصيل المنتج:", error);
        loadingMessage.classList.add('hidden');
        errorMessage.classList.remove('hidden');
        productSalesLetterContent.classList.add('hidden');
    }
}

// DOMContentLoaded Listener
document.addEventListener('DOMContentLoaded', () => {
    // تعيين عناصر DOM الرئيسية
    modeToggleButton = document.getElementById('modeToggleButton');
    modeToggleIcon = document.getElementById('modeToggleIcon');
    userIdDisplay = document.getElementById('userIdDisplay');
    universalModal = document.getElementById('universalModal');
    modalTitle = document.getElementById('modalTitle');
    modalContent = document.getElementById('modalContent');
    modalActions = document.getElementById('modalActions');
    loadingIndicator = document.getElementById('loadingIndicator');
    
    // تعيين عناصر DOM لصفحة خطاب المبيعات الجديدة
    productSalesLetterContent = document.getElementById('productSalesLetterContent');
    loadingMessage = document.getElementById('loadingMessage');
    errorMessage = document.getElementById('errorMessage');
    goToHomePageButton = document.getElementById('goToHomePage');

    // تعيين عناصر قسم البطل (Hero Section)
    salesLetterProductName = document.getElementById('salesLetterProductName');
    salesLetterProductSlogan = document.getElementById('salesLetterProductSlogan');
    salesLetterMainImage = document.getElementById('salesLetterMainImage');
    salesLetterShortDescription = document.getElementById('salesLetterShortDescription');
    addToCartButton = document.getElementById('addToCartButton'); // الزر الأول
    viewProductDetailsButton = document.getElementById('viewProductDetailsButton'); // زر مشاهدة المنتج

    // تعيين عناصر الأقسام الجديدة
    materialsAndDimensionsSection = document.getElementById('materialsAndDimensionsSection');
    materialsAndDimensionsContent = document.getElementById('materialsAndDimensionsContent');
    technologiesSection = document.getElementById('technologiesSection');
    technologiesContent = document.getElementById('technologiesContent');
    warrantyAndServiceSection = document.getElementById('warrantyAndServiceSection');
    warrantyAndServiceContent = document.getElementById('warrantyAndServiceContent');
    finalAddToCartButton = document.getElementById('finalAddToCartButton'); // الزر النهائي

    // عناصر DOM للقائمة المنسدلة (من Header)
    const menuDropdownButton = document.getElementById('menuDropdownButton');
    const menuDropdown = document.getElementById('menuDropdown');
    const menuDropdownIcon = document.getElementById('menuDropdownIcon');

    // Initial theme application
    const storedDarkMode = localStorage.getItem('darkMode');
    if (storedDarkMode === 'true') {
        isDarkMode = true;
    }
    applyTheme();

    // Event Listeners for Modals (to close when clicking outside)
    if (universalModal) {
        universalModal.addEventListener('click', (e) => {
            if (e.target === universalModal) {
                closeModal();
            }
        });
    }

    // Event Listeners for Header Icons
    if (modeToggleButton) {
        modeToggleButton.addEventListener('click', toggleDarkMode);
    }

    // Toggle Dropdown Menu and change icon
    if (menuDropdownButton && menuDropdown && menuDropdownIcon) {
        menuDropdownButton.addEventListener('click', (event) => {
            event.stopPropagation();
            const isShowing = menuDropdown.classList.toggle('show');
            menuDropdownIcon.textContent = isShowing ? 'arrow_drop_up' : 'arrow_drop_down';
        });

        // Close Dropdown Menu when clicking outside
        document.addEventListener('click', (event) => {
            if (menuDropdown && menuDropdownButton && !menuDropdown.contains(event.target) && !menuDropdownButton.contains(event.target)) {
                menuDropdown.classList.remove('show');
                menuDropdownIcon.textContent = 'arrow_drop_down';
            }
        });
    }

    // Handle the "Manage Account" link from header
    const manageAccountLink = document.getElementById('manageAccountLink');
    if (manageAccountLink) {
        manageAccountLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(); // أغلق أي مودال مفتوح
            openModal('إدارة الحساب', 'هنا يمكنك إضافة منطق لتسجيل الدخول أو الخروج أو إدارة الملف الشخصي.', [{ text: 'موافق', className: 'bg-blue-500 text-white', onClick: closeModal }]);
        });
    }

    // Event Listener لزر "العودة إلى الرئيسية" في رسالة الخطأ
    if (goToHomePageButton) {
        goToHomePageButton.addEventListener('click', () => {
            window.location.href = 'Index.html'; // أو الصفحة الرئيسية لمنتجاتك
        });
    }

    // Event Listener لزر "أضف إلى السلة" (الزر الأول والزر النهائي)
    [addToCartButton, finalAddToCartButton].forEach(button => {
        if (button) {
            button.addEventListener('click', () => {
                if (productId) {
                    openModal('إضافة للسلة', `تم إضافة "${salesLetterProductName.textContent}" إلى سلة التسوق!`, [{ text: 'موافق', className: 'bg-green-600 text-white', onClick: closeModal }]);
                    // هنا يمكنك إضافة منطق سلة التسوق الفعلي
                } else {
                    openModal('خطأ', 'لم يتم تحديد منتج لإضافته إلى السلة.', [{ text: 'حسناً', className: 'bg-red-500 text-white', onClick: closeModal }]);
                }
            });
        }
    });

    // Event Listener لزر "شاهد المنتج عن قرب"
    if (viewProductDetailsButton) {
        viewProductDetailsButton.addEventListener('click', () => {
            if (productId) {
                window.location.href = `ProductGallery.html?id=${productId}`; // التوجيه إلى صفحة المعرض مع معرّف المنتج
            } else {
                openModal('خطأ', 'لم يتم تحديد منتج لعرض تفاصيله الكاملة.', [{ text: 'حسناً', className: 'bg-red-500 text-white', onClick: closeModal }]);
            }
        });
    }

    // Firebase Auth State Listener
    onAuthStateChanged(auth, async (user) => {
        try {
            if (user) {
                currentUserId = user.uid;
                if (userIdDisplay) userIdDisplay.textContent = `هوية المستخدم: ${currentUserId}`;
                
                // جلب معرّف المنتج من URL
                const urlParams = new URLSearchParams(window.location.search);
                productId = urlParams.get('id'); // expects URL like productDetailsViewer.html?id=YOUR_PRODUCT_ID
                if (productId) {
                    await fetchAndDisplayProductDetails(productId);
                } else {
                    errorMessage.classList.remove('hidden');
                    loadingMessage.classList.add('hidden');
                    productSalesLetterContent.classList.add('hidden');
                    errorMessage.querySelector('p').textContent = 'لم يتم تحديد معرّف المنتج في الرابط.';
                }
            } else {
                try {
                    await signInAnonymously(auth);
                } catch (authError) {
                    console.error("خطأ في تسجيل الدخول (مجهول):", authError);
                    if (userIdDisplay) userIdDisplay.textContent = `فشل المصادقة: ${authError.message}`;
                    errorMessage.classList.remove('hidden');
                    loadingMessage.classList.add('hidden');
                    productSalesLetterContent.classList.add('hidden');
                    errorMessage.querySelector('p').textContent = `تعذر تسجيل الدخول للمتابعة: ${authError.message}`;
                }
            }
        } catch (initialError) {
            console.error("خطأ عام في تهيئة الصفحة:", initialError);
            errorMessage.classList.remove('hidden');
            loadingMessage.classList.add('hidden');
            productSalesLetterContent.classList.add('hidden');
            errorMessage.querySelector('p').textContent = `حدث خطأ غير متوقع: ${initialError.message}`;
        }
    });
});
