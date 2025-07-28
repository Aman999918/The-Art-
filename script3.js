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

// عناصر DOM لصفحة عرض تفاصيل المنتج

let productDetailsContent;

let loadingMessage;

let errorMessage;

let goToHomePageButton;

let productMainImage;

let productImageGallery;

let productNameElement;

let productPriceElement;

let productCategoryElement;

let productDescriptionShortElement;

let dynamicSectionsContainer;

let addToCartButton;

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

    if (!document.body || !modeToggleIcon || !menuDropdownIcon) {

        console.warn("Critical header elements not found for theme application. Retrying in 50ms.");

        setTimeout(applyTheme, 50);

        return;

    }

    document.body.classList.toggle('dark-mode', isDarkMode);

    modeToggleIcon.textContent = isDarkMode ? 'dark_mode' : 'light_mode';

    const headerIcons = document.querySelectorAll('header .material-symbols-outlined');

    headerIcons.forEach(icon => {

        if (!icon) return;

        if (icon.id !== 'modeToggleIcon') {

            if (isDarkMode) {

                icon.style.color = 'var(--light-red)';

            } else {

                icon.style.color = 'var(--primary-red)';

            }

        }

    });

    const dropdownItems = document.querySelectorAll('#menuDropdown a .material-symbols-outlined');

     dropdownItems.forEach(icon => {

        if (!icon) return;

        if (isDarkMode) {

            icon.style.color = 'var(--light-red)';

        } else {

            icon.style.color = 'var(--primary-red)';

        }

    });

}

// ** الدوال الجديدة لعرض تفاصيل المنتج **

// دالة لجلب وعرض تفاصيل المنتج

async function fetchAndDisplayProductDetails(productId) {

    if (!currentUserId || !productId) {

        errorMessage.classList.remove('hidden');

        loadingMessage.classList.add('hidden');

        productDetailsContent.classList.add('hidden');

        return;

    }

    loadingMessage.classList.remove('hidden');

    errorMessage.classList.add('hidden');

    productDetailsContent.classList.add('hidden');

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

        

        // عرض المعلومات الأساسية

        productNameElement.textContent = productData.name || 'منتج غير معروف';

        productPriceElement.textContent = `السعر: $${(productData.price || 0).toFixed(2)}`;

        productCategoryElement.textContent = `الفئة: ${productData.category || 'غير مصنفة'}`;

        productDescriptionShortElement.textContent = productData.description || 'لا يوجد وصف قصير لهذا المنتج.';

        productMainImage.src = productData.imageUrl || 'placeholder.png'; // الصورة الرئيسية

        // عرض صور المعرض (إذا وجدت في بيانات المنتج الأصلية)

        productImageGallery.innerHTML = '';

        if (productData.galleryImages && productData.galleryImages.length > 0) {

            productData.galleryImages.forEach(imgSrc => {

                const img = document.createElement('img');

                img.src = imgSrc;

                img.alt = productData.name;

                img.addEventListener('click', () => {

                    productMainImage.src = imgSrc; // تغيير الصورة الرئيسية عند النقر على صورة المعرض

                });

                productImageGallery.appendChild(img);

            });

        } else {

             // إذا لم تكن هناك صور إضافية، فقط ضع الصورة الرئيسية كصورة معرض مصغرة أيضاً

             const img = document.createElement('img');

             img.src = productData.imageUrl || 'placeholder.png';

             img.alt = productData.name;

             img.addEventListener('click', () => {

                productMainImage.src = productData.imageUrl || 'placeholder.png';

             });

             productImageGallery.appendChild(img);

        }

        // جلب الأقسام الديناميكية من مجموعة 'productDetails'

        const dynamicDetailsDocRef = doc(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/productDetails`, productId);

        const dynamicDetailsSnap = await getDoc(dynamicDetailsDocRef);

        dynamicSectionsContainer.innerHTML = ''; // مسح الأقسام القديمة

        if (dynamicDetailsSnap.exists()) {

            const dynamicData = dynamicDetailsSnap.data();

            const sections = dynamicData.sections || [];

            // فرز الأقسام حسب الترتيب (إذا كان حقل الترتيب موجوداً)

            sections.sort((a, b) => (a.order || 0) - (b.order || 0));

            sections.forEach(section => {

                const sectionDiv = document.createElement('div');

                sectionDiv.className = 'dynamic-section-container';

                let sectionTitleHtml = '';

                let sectionContentHtml = '';

                switch (section.type) {

                    case 'description':

                        sectionTitleHtml = `<h3><span class="material-symbols-outlined">description</span> وصف المنتج التفصيلي</h3>`;

                        if (section.lines && section.lines.length > 0) {

                            section.lines.forEach(line => {

                                if (line.content && line.content.trim() !== '') {

                                    if (line.type === 'heading') {

                                        sectionContentHtml += `<h4 class="description-line-heading">${line.content}</h4>`;

                                    } else if (line.type === 'highlight') {

                                        sectionContentHtml += `<p class="description-line-highlight">${line.content}</p>`;

                                    } else { // paragraph

                                        sectionContentHtml += `<p>${line.content}</p>`;

                                    }

                                }

                            });

                        } else {

                            sectionContentHtml += `<p class="text-gray-500 dark:text-gray-400">لا يوجد وصف تفصيلي إضافي لهذا المنتج.</p>`;

                        }

                        break;

                    case 'images':

                        sectionTitleHtml = `<h3><span class="material-symbols-outlined">image</span> معرض الصور الإضافي</h3>`;

                        if (section.images && section.images.length > 0) {

                            sectionContentHtml += `<div class="viewer-image-grid">`;

                            section.images.forEach(imgSrc => {

                                sectionContentHtml += `<img src="${imgSrc}" alt="صورة إضافية للمنتج">`;

                            });

                            sectionContentHtml += `</div>`;

                        } else {

                            sectionContentHtml += `<p class="text-gray-500 dark:text-gray-400">لا توجد صور إضافية لهذا القسم.</p>`;

                        }

                        break;

                    case 'info_card':

                        sectionTitleHtml = `<h3><span class="material-symbols-outlined">info</span> معلومات إضافية</h3>`;

                        if (section.items && section.items.length > 0) {

                            sectionContentHtml += `<div class="viewer-info-card">`;

                            section.items.forEach(item => {

                                if (item.key && item.value) {

                                    sectionContentHtml += `

                                        <div class="viewer-info-item">

                                            <span class="key">${item.key}:</span>

                                            <span class="value">${item.value}</span>

                                        </div>

                                    `;

                                }

                            });

                            sectionContentHtml += `</div>`;

                        } else {

                            sectionContentHtml += `<p class="text-gray-500 dark:text-gray-400">لا توجد معلومات إضافية لهذا القسم.</p>`;

                        }

                        break;

                    default:

                        // تجاوز أي أنواع أقسام غير معروفة

                        break;

                }

                

                if (sectionTitleHtml) { // فقط أضف القسم إذا كان له محتوى

                    sectionDiv.innerHTML = sectionTitleHtml + `<div class="p-2">${sectionContentHtml}</div>`;

                    dynamicSectionsContainer.appendChild(sectionDiv);

                }

            });

        } else {

            const noDynamicSectionsMessage = document.createElement('div');

            noDynamicSectionsMessage.className = 'dynamic-section-container text-center text-gray-500 dark:text-gray-400';

            noDynamicSectionsMessage.innerHTML = `<p class="p-4">لا توجد تفاصيل ديناميكية إضافية لهذا المنتج.</p>`;

            dynamicSectionsContainer.appendChild(noDynamicSectionsMessage);

        }

        loadingMessage.classList.add('hidden');

        productDetailsContent.classList.remove('hidden'); // إظهار المحتوى بعد التحميل

        applyTheme(); // تطبيق الثيم على العناصر الجديدة

        

    } catch (error) {

        console.error("خطأ في جلب أو عرض تفاصيل المنتج:", error);

        loadingMessage.classList.add('hidden');

        errorMessage.classList.remove('hidden');

        productDetailsContent.classList.add('hidden');

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

    

    // تعيين عناصر DOM لصفحة عرض تفاصيل المنتج

    productDetailsContent = document.getElementById('productDetailsContent');

    loadingMessage = document.getElementById('loadingMessage');

    errorMessage = document.getElementById('errorMessage');

    goToHomePageButton = document.getElementById('goToHomePage');

    productMainImage = document.getElementById('productMainImage');

    productImageGallery = document.getElementById('productImageGallery');

    productNameElement = document.getElementById('productName');

    productPriceElement = document.getElementById('productPrice');

    productCategoryElement = document.getElementById('productCategory');

    productDescriptionShortElement = document.getElementById('productDescriptionShort');

    dynamicSectionsContainer = document.getElementById('dynamicSectionsContainer');

    addToCartButton = document.getElementById('addToCartButton');

    

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

    // Event Listener لزر "أضف إلى السلة"

    if (addToCartButton) {

        addToCartButton.addEventListener('click', () => {

            if (productId) {

                openModal('إضافة للسلة', `تم إضافة "${productNameElement.textContent}" إلى سلة التسوق!`, [{ text: 'موافق', className: 'bg-green-600 text-white', onClick: closeModal }]);

                // هنا يمكنك إضافة منطق سلة التسوق الفعلي

            } else {

                openModal('خطأ', 'لم يتم تحديد منتج لإضافته إلى السلة.', [{ text: 'حسناً', className: 'bg-red-500 text-white', onClick: closeModal }]);

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

                    productDetailsContent.classList.add('hidden');

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

                    productDetailsContent.classList.add('hidden');

                    errorMessage.querySelector('p').textContent = `تعذر تسجيل الدخول للمتابعة: ${authError.message}`;

                }

            }

        } catch (initialError) {

            console.error("خطأ عام في تهيئة الصفحة:", initialError);

            errorMessage.classList.remove('hidden');

            loadingMessage.classList.add('hidden');

            productDetailsContent.classList.add('hidden');

            errorMessage.querySelector('p').textContent = `حدث خطأ غير متوقع: ${initialError.message}`;

        }

    });

});