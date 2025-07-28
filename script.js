// استيراد مكتبات Firebase الأساسية

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { getFirestore, collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// **إعدادات Firebase الخاصة بمشروعك (تأكد من صحتها)**

const firebaseConfig = {

  apiKey: "AIzaSyBRMKKR7URejme05AJ9-ufnj9Ehcg67Pfg",

  authDomain: "aman-safety.firebaseapp.com",

  projectId: "aman-safety",

  messagingSenderId: "16880858",

  appId: "1:168805958858:web:bccc84abcf58a180132033",

  measurementId: "G-N6DDZ6N7GW"

};

// تهيئة Firebase

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

let currentUserId = null;

let isDarkMode = false; // لتتبع وضع العرض (ليلي/نهاري)

// **عناصر DOM الهامة (يتم تعريفها بـ 'let' وسيتم تعيين قيمها داخل DOMContentLoaded)**

let modeToggleButton;

let modeToggleIcon;

let menuDropdownButton;

let menuDropdown;

let menuDropdownIcon;

let universalModal;

let modalTitle;

let modalContent;

let modalActions;

let loadingIndicator;

let productsList;

let noProductsMessage;

// --- دوال المودال العامة (Universal Modal) ---

function openModal(title, message, buttons = [], isLoading = false) {

    // تحقق من وجود جميع العناصر الضرورية قبل الاستخدام

    if (!universalModal || !modalTitle || !modalContent || !modalActions || !loadingIndicator) {

        console.error("خطأ: عناصر المودال العامة غير موجودة في DOM. تأكد من تحميل HTML بالكامل.");

        return;

    }

    modalTitle.textContent = title;

    modalContent.innerHTML = message;

    modalActions.innerHTML = ''; // مسح الأزرار السابقة

    buttons.forEach(btn => {

        const buttonElement = document.createElement('button');

        buttonElement.textContent = btn.text;

        // استخدم Tailwind classes بشكل أفضل ومرونة

        buttonElement.className = `py-2 px-4 rounded font-bold ${btn.className || 'bg-gray-300 text-gray-800 hover:bg-gray-400'}`;

        buttonElement.onclick = () => { btn.onClick(); };

        modalActions.appendChild(buttonElement);

    });

    if (isLoading) {

        loadingIndicator.classList.remove('hidden');

        modalActions.classList.add('hidden');

    } else {

        loadingIndicator.classList.add('hidden');

        modalActions.classList.remove('hidden');

    }

    universalModal.classList.add('active');

    document.body.classList.add('no-scroll'); // لمنع التمرير في الخلفية

}

function closeModal() {

    if (universalModal) {

        universalModal.classList.remove('active');

        document.body.classList.remove('no-scroll');

        // تنظيف محتوى المودال

        if (modalTitle) modalTitle.textContent = '';

        if (modalContent) modalContent.innerHTML = '';

        if (modalActions) modalActions.innerHTML = '';

        if (loadingIndicator) loadingIndicator.classList.add('hidden');

    }

}

// --- دوال الثيم (الوضع الليلي/النهاري) ---

function toggleDarkMode() {

    isDarkMode = !isDarkMode;

    localStorage.setItem('darkMode', isDarkMode); // حفظ التفضيل

    applyTheme();

}

function applyTheme() {

    // تحقق من وجود العناصر الأساسية للهيدر والجسم

    if (!document.body || !modeToggleIcon || !menuDropdownIcon) {

        // إذا لم تكن العناصر موجودة بعد، انتظر قليلاً وأعد المحاولة

        console.warn("عناصر الهيدر الأساسية غير موجودة لتطبيق الثيم. إعادة المحاولة بعد 50 مللي ثانية.");

        setTimeout(applyTheme, 50);

        return;

    }

    document.body.classList.toggle('dark-mode', isDarkMode);

    modeToggleIcon.textContent = isDarkMode ? 'dark_mode' : 'light_mode';

    // تحديث ألوان الأيقونات في الهيدر

    const headerIcons = document.querySelectorAll('header .material-symbols-outlined');

    headerIcons.forEach(icon => {

        if (icon && icon.id !== 'modeToggleIcon' && icon.id !== 'menuDropdownIcon') {

            icon.style.color = isDarkMode ? 'var(--light-red)' : 'var(--primary-red)';

        }

    });

    // تحديث ألوان بطاقات المنتجات

    const productItems = document.querySelectorAll('.product-item');

    productItems.forEach(item => {

        if (item) { // تأكد أن العنصر موجود

            if (isDarkMode) {

                item.style.backgroundColor = 'var(--card-dark)';

                const h4 = item.querySelector('h4');

                const pCategory = item.querySelector('p.text-gray-500'); // التصنيف

                const pDescription = item.querySelector('p.text-gray-700'); // الوصف

                const priceSpan = item.querySelector('.product-item-content p.font-bold span.line-through');

                const viewDetailsBtn = item.querySelector('.view-details-btn');

                const priceActualSpan = item.querySelector('.product-item-content p.font-bold span.text-red-600'); // السعر بعد الخصم

                const ratingSpan = item.querySelector('.product-item-content span.text-yellow-600'); // التقييم

                if (h4) h4.style.color = 'var(--light-red)';

                if (pCategory) pCategory.style.color = 'var(--text-light)';

                if (pDescription) pDescription.style.color = 'var(--text-light)';

                if (priceSpan) priceSpan.style.color = 'var(--text-light-muted)'; // السعر الأصلي المشطوب

                if (priceActualSpan) priceActualSpan.style.color = 'var(--light-red)'; // السعر بعد الخصم (قد ترغب في لون مختلف للداكن)

                if (ratingSpan) ratingSpan.style.color = 'var(--text-light)'; // لون التقييم

                if (viewDetailsBtn) viewDetailsBtn.style.color = 'var(--text-light-muted)';

            } else {

                item.style.backgroundColor = 'var(--card-light)';

                const h4 = item.querySelector('h4');

                const pCategory = item.querySelector('p.text-gray-500');

                const pDescription = item.querySelector('p.text-gray-700');

                const priceSpan = item.querySelector('.product-item-content p.font-bold span.line-through');

                const viewDetailsBtn = item.querySelector('.view-details-btn');

                const priceActualSpan = item.querySelector('.product-item-content p.font-bold span.text-red-600');

                const ratingSpan = item.querySelector('.product-item-content span.text-yellow-600');

                if (h4) h4.style.color = 'var(--primary-red)';

                if (pCategory) pCategory.style.color = 'var(--text-dark-muted)'; // text-gray-500

                if (pDescription) pDescription.style.color = 'var(--text-dark)'; // text-gray-700

                if (priceSpan) priceSpan.style.color = '#6b7280'; // لون رمادي افتراضي

                if (priceActualSpan) priceActualSpan.style.color = '#dc2626'; // لون أحمر افتراضي

                if (ratingSpan) ratingSpan.style.color = '#d97706'; // لون أصفر/ذهبي افتراضي

                if (viewDetailsBtn) viewDetailsBtn.style.color = 'var(--text-dark)';

            }

        }

    });

}

// --- دالة عرض المنتجات ---

function renderProductsForCustomers(products) {

    // تحقق من وجود العناصر الأساسية قبل البدء

    if (!productsList || !noProductsMessage) {

        console.error("خطأ: عناصر قائمة المنتجات أو رسالة عدم وجود منتجات غير موجودة في DOM.");

        return;

    }

    productsList.innerHTML = ''; // مسح أي منتجات سابقة

    if (products.length === 0) {

        noProductsMessage.classList.remove('hidden');

        return;

    }

    noProductsMessage.classList.add('hidden'); // إخفاء رسالة لا توجد منتجات

    products.forEach(product => {

        const productItem = document.createElement('div');

        productItem.dataset.productId = product.id; // لتخزين ID المنتج

        productItem.className = `product-item relative cursor-pointer bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg`;

        let priceHtml = '';

        // تحقق من وجود السعر وقابليته للتحويل إلى رقم

        if (product.price !== undefined && product.price !== null && !isNaN(parseFloat(product.price))) { 

            const originalPrice = parseFloat(product.price); // تأكد من تحويله لرقم

            

            if (product.discountPercentage && product.discountPercentage > 0) {

                const discountAmount = originalPrice * (product.discountPercentage / 100);

                const discountedPrice = originalPrice - discountAmount;

                

                priceHtml = `

                    <p class="font-bold mt-1 text-primary-red">

                        <span class="line-through text-gray-500 dark:text-gray-400">${originalPrice.toFixed(2)} ريال</span> 

                        <span class="text-red-600 font-bold ml-2">${discountedPrice.toFixed(2)} ريال</span>

                    </p>

                `;

            } else {

                priceHtml = `<p class="font-bold mt-1 text-primary-red">${originalPrice.toFixed(2)} ريال</p>`;

            }

        }

        let ratingHtml = '';

        // تحقق من وجود التقييم وقابليته للتحويل إلى رقم

        if (product.rating !== undefined && product.rating !== null && !isNaN(parseFloat(product.rating))) {

            // للتأكد من عرض نجمة واحدة فقط إذا كان التقييم موجود

            ratingHtml = `<span class="text-yellow-600 text-sm flex items-center mt-2">${product.rating} <span class="material-symbols-outlined text-sm ml-1">star</span></span>`;

        }

        let discountBadgeHtml = '';

        if (product.discountPercentage && product.discountPercentage > 0) {

            discountBadgeHtml = `

                <div class="discount-badge absolute top-2 right-2 bg-red-600 text-white text-xs font-bold py-1 px-2 rounded-full">

                    %${product.discountPercentage} خصم

                </div>

            `;

        }

        productItem.innerHTML = `

            ${discountBadgeHtml} 

            <img src="${product.image || 'https://placehold.co/400x200/cccccc/000000?text=لا توجد صورة'}"

                 alt="${product.name || 'منتج'}"

                 onerror="this.onerror=null;this.src='https://placehold.co/400x200/cccccc/000000?text=فشل تحميل الصورة';"

                 loading="lazy"

                 class="w-full h-48 object-cover"> 

            

            <div class="product-item-content p-4">

                <h4 class="text-xl font-semibold text-primary-red mb-1">${product.name || 'منتج غير معروف'}</h4>

                <p class="text-gray-500 dark:text-gray-400 text-sm mb-2">التصنيف: ${product.category || 'غير محدد'}</p> 

                <p class="text-gray-700 dark:text-gray-300 text-base mb-2 line-clamp-2">${product.description || 'لا يوجد وصف.'}</p>

                ${priceHtml}  ${ratingHtml}  </div>

            <div class="flex justify-center p-4 border-t border-gray-200 dark:border-gray-700">

                <a href="ProductDetailsViewer.html?id=${product.id}" 

                   class="view-details-btn text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-full transition-colors duration-200" 

                   title="عرض التفاصيل">

                    <span class="material-symbols-outlined">info</span> عرض التفاصيل

                </a>

            </div>

        `;

        productsList.appendChild(productItem);

        // إضافة مستمع حدث للنقر على كامل بطاقة المنتج للانتقال

        productItem.addEventListener('click', (e) => {

            // منع الانتقال إذا كان النقر على الرابط داخل الزر نفسه (لتجنب التكرار)

            if (e.target.closest('.view-details-btn')) {

                return;

            }

            // الانتقال إلى صفحة التفاصيل عند النقر على أي مكان آخر في البطاقة

            window.location.href = `ProductDetailsViewer.html?id=${product.id}`;

        });

    });

    applyTheme(); // تطبيق الثيم بعد إضافة المنتجات

}

// --- DOMContentLoaded Listener: عند تحميل محتوى الصفحة بالكامل ---

document.addEventListener('DOMContentLoaded', () => {

    // ** تعيين عناصر DOM هنا لضمان أنها موجودة بعد تحميل HTML **

    modeToggleButton = document.getElementById('modeToggleButton');

    modeToggleIcon = document.getElementById('modeToggleIcon');

    menuDropdownButton = document.getElementById('menuDropdownButton');

    menuDropdown = document.getElementById('menuDropdown');

    menuDropdownIcon = document.getElementById('menuDropdownIcon');

    universalModal = document.getElementById('universalModal');

    modalTitle = document.getElementById('modalTitle');

    modalContent = document.getElementById('modalContent');

    modalActions = document.getElementById('modalActions');

    loadingIndicator = document.getElementById('loadingIndicator');

    productsList = document.getElementById('productsList');

    noProductsMessage = document.getElementById('noProductsMessage');

    // تطبيق الثيم الأولي بناءً على التفضيل المحفوظ

    const storedDarkMode = localStorage.getItem('darkMode');

    if (storedDarkMode === 'true') {

        isDarkMode = true;

    }

    applyTheme(); 

    // مستمع حدث لزر تبديل الوضع (النهاري/الليلي)

    if (modeToggleButton) {

        modeToggleButton.addEventListener('click', toggleDarkMode);

    }

    // مستمع حدث لإغلاق المودال عند النقر خارجها

    if (universalModal) {

        universalModal.addEventListener('click', (e) => {

            if (e.target === universalModal) {

                closeModal();

            }

        });

    }

    // مستمع حدث لزر القائمة المنسدلة في الهيدر

    if (menuDropdownButton && menuDropdown && menuDropdownIcon) {

        menuDropdownButton.addEventListener('click', (event) => {

            event.stopPropagation(); // منع إغلاق القائمة عند النقر على الزر نفسه

            const isShowing = menuDropdown.classList.toggle('show');

            menuDropdownIcon.textContent = isShowing ? 'close' : 'menu'; // تغيير الأيقونة

        });

        // إغلاق القائمة المنسدلة عند النقر خارجها

        document.addEventListener('click', (event) => {

            if (menuDropdown && menuDropdownButton && 

                !menuDropdown.contains(event.target) && !menuDropdownButton.contains(event.target)) {

                menuDropdown.classList.remove('show');

                menuDropdownIcon.textContent = 'menu';

            }

        });

    }

    // --- مصادقة Firebase وجلب المنتجات ---

    onAuthStateChanged(auth, async (user) => {

        try {

            if (user) {

                currentUserId = user.uid;

                // جلب المنتجات من Firestore (المسار الصحيح لمجموعتك)

                // تأكد أن هذا المسار يطابق بالضبط ما هو موجود في قاعدة بياناتك على Firebase

                const productsCollectionRef = collection(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/products`);

                const q = query(productsCollectionRef, orderBy('name', 'asc')); 

                

                openModal('جاري التحميل', 'جاري جلب المنتجات، الرجاء الانتظار...', [], true); // عرض رسالة تحميل

                // استخدام onSnapshot للاستماع للتغييرات في الوقت الفعلي

                onSnapshot(q, (snapshot) => {

                    closeModal(); // إغلاق رسالة التحميل بعد استلام البيانات

                    const products = [];

                    snapshot.forEach(doc => {

                        products.push({ id: doc.id, ...doc.data() });

                    });

                    renderProductsForCustomers(products); // عرض المنتجات

                }, (error) => {

                    console.error("خطأ في جلب المنتجات من Firestore:", error);

                    openModal('خطأ', `فشل جلب المنتجات: ${error.message}`, [{ text: 'حسناً', className: 'bg-red-500 text-white', onClick: closeModal }]);

                });

            } else {

                // تسجيل الدخول كمجهول إذا لم يكن هناك مستخدم مسجل

                try {

                    await signInAnonymously(auth);

                } catch (authError) {

                    console.error("خطأ في تسجيل الدخول (مجهول):", authError);

                    openModal('خطأ', `تعذر الاتصال بقاعدة البيانات. الرجاء المحاولة لاحقًا: ${authError.message}`, [{ text: 'حسناً', className: 'bg-red-500 text-white', onClick: closeModal }]);

                }

            }

        } catch (initialError) {

            console.error("خطأ عام في تهيئة الصفحة:", initialError);

            openModal('خطأ', `حدث خطأ غير متوقع: ${initialError.message}`, [{ text: 'حسناً', className: 'bg-red-500 text-white', onClick: closeModal }]);

        }

    });

});