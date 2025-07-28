// استيراد مكتبات Firebase (إصدار 10.12.5)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"; // أضفنا setDoc

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

let selectedProductId = null; // المنتج الذي يتم إعداد تفاصيله

let productDetailsSections = []; // مصفوفة لتخزين الأقسام المضافة (الوصف، الصور، البطاقات)

// عناصر DOM الرئيسية

let modeToggleButton;

let modeToggleIcon;

let userIdDisplay;

let universalModal;

let modalTitle;

let modalContent;

let modalActions;

let loadingIndicator;

// عناصر DOM الخاصة ببناء التفاصيل

let productIdSelect;

let selectedProductNameDisplay;

let sectionsContainer;

let addSectionButton;

let addSectionOptions;

let saveProductDetailsButton;

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

// ** الدوال الجديدة لإدارة أقسام تفاصيل المنتج الديناميكية **

// دالة لإنشاء قسم جديد في الواجهة

function createSectionElement(sectionData, index) {

    const sectionItem = document.createElement('div');

    sectionItem.className = 'section-item';

    sectionItem.dataset.index = index; // لربط العنصر بالبيانات في المصفوفة

    let sectionContentHtml = '';

    let sectionTitle = '';

    let sectionIcon = '';

    switch (sectionData.type) {

        case 'description':

            sectionTitle = 'قسم الوصف';

            sectionIcon = 'description';

            // استخدام "lines" كمصفوفة لتخزين كل سطر من الوصف

            sectionContentHtml = `

                <div class="description-lines-container" data-index="${index}">

                    ${(sectionData.lines || []).map((line, lineIdx) => `

                        <div class="description-line-item flex items-center gap-2 mb-2">

                            <select class="line-type-select border border-gray-300 rounded p-2 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 w-32">

                                <option value="paragraph" ${line.type === 'paragraph' ? 'selected' : ''}>فقرة عادية</option>

                                <option value="heading" ${line.type === 'heading' ? 'selected' : ''}>عنوان رئيسي</option>

                                <option value="highlight" ${line.type === 'highlight' ? 'selected' : ''}>نص مميز</option>

                            </select>

                            <textarea class="line-content-textarea flex-grow border border-gray-300 rounded p-2 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" rows="1" placeholder="أدخل محتوى السطر...">${line.content || ''}</textarea>

                            <button type="button" class="remove-line-btn text-red-500 hover:text-red-700" data-line-index="${lineIdx}">

                                <span class="material-symbols-outlined">delete</span>

                            </button>

                        </div>

                    `).join('')}

                </div>

                <button type="button" class="add-description-line-btn mt-2 bg-gray-200 text-gray-700 py-1 px-3 rounded text-sm hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">

                    <span class="material-symbols-outlined text-sm ml-1 align-middle">add</span> إضافة سطر جديد

                </button>

            `;

            break;

        case 'images':

            sectionTitle = 'معرض الصور';

            sectionIcon = 'image';

            sectionContentHtml = `

                <input type="file" multiple accept="image/*" class="mt-2 block w-full text-gray-800 dark:text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-red file:text-white hover:file:bg-dark-red dark:file:bg-light-red dark:hover:file:bg-dark-red">

                <div class="image-upload-preview" data-index="${index}">

                    ${(sectionData.images || []).map((img, imgIdx) => `

                        <div class="image-preview-item">

                            <img src="${img}" alt="صورة منتج">

                            <button type="button" class="remove-image-btn" data-image-index="${imgIdx}"><span class="material-symbols-outlined text-xs">close</span></button>

                        </div>

                    `).join('')}

                </div>

            `;

            break;

        case 'info_card':

            sectionTitle = 'بطاقة معلومات';

            sectionIcon = 'info';

            sectionContentHtml = `

                <div class="info-card-items-container" data-index="${index}">

                    ${(sectionData.items || []).map((item, itemIdx) => `

                        <div class="info-card-item">

                            <input type="text" class="border border-gray-300 rounded p-2 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" placeholder="المفتاح (مثلاً: الضمان)" value="${item.key || ''}">

                            <input type="text" class="border border-gray-300 rounded p-2 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" placeholder="القيمة (مثلاً: سنتان)" value="${item.value || ''}">

                            <button type="button" class="remove-info-item-btn" data-item-index="${itemIdx}"><span class="material-symbols-outlined">delete</span></button>

                        </div>

                    `).join('')}

                </div>

                <button type="button" class="add-info-item-btn mt-2 bg-gray-200 text-gray-700 py-1 px-3 rounded text-sm hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">

                    <span class="material-symbols-outlined text-sm ml-1 align-middle">add</span> إضافة بند جديد

                </button>

            `;

            break;

    }

    sectionItem.innerHTML = `

        <div class="section-header">

            <h4><span class="material-symbols-outlined ml-2 align-middle">${sectionIcon}</span> ${sectionTitle}</h4>

            <div class="section-controls">

                <button type="button" class="delete-section-btn" title="حذف القسم"><span class="material-symbols-outlined">delete</span></button>

            </div>

        </div>

        <div class="section-body">

            ${sectionContentHtml}

        </div>

    `;

    sectionsContainer.appendChild(sectionItem);

    // إضافة معالجات الأحداث للعناصر داخل القسم الجديد

    addSectionEventListeners(sectionItem, index);

    applyTheme(); // لتطبيق الثيم على العناصر الجديدة

}

// دالة لإضافة معالجات الأحداث للأقسام الديناميكية

function addSectionEventListeners(sectionElement, index) {

    // معالج حدث زر الحذف

    sectionElement.querySelector('.delete-section-btn').addEventListener('click', () => {

        openModal('تأكيد الحذف', 'هل أنت متأكد أنك تريد حذف هذا القسم؟', [

            { text: 'إلغاء', className: 'bg-gray-300 text-gray-800', onClick: closeModal },

            { text: 'حذف', className: 'bg-red-500 text-white', onClick: () => {

                closeModal();

                deleteSection(index);

            }}

        ]);

    });

    // معالجات أحداث خاصة بنوع القسم

    const sectionData = productDetailsSections[index];

    switch (sectionData.type) {

        case 'description':

            // إضافة بند افتراضي إذا لم يكن هناك أي سطور وصف

            if (!sectionData.lines || sectionData.lines.length === 0) {

                sectionData.lines = [{ type: 'paragraph', content: '' }];

                // لا نحتاج لإعادة الرسم هنا مباشرة بعد الإضافة الأولية

                // لأن هذه الدالة يتم استدعاؤها بعد إنشاء العنصر بناءً على البيانات.

                // إذا أضفنا سطراً وتركنا الدالة هنا، سيتم إعادة رسم القسم مرة أخرى مما قد يسبب مشاكل.

                // يتم إعادة الرسم بعد أي تعديل على lines array (إضافة/حذف/تغيير محتوى).

            }

            

            // معالجة تغيير نوع السطر أو محتواه

            sectionElement.querySelectorAll('.line-type-select, .line-content-textarea').forEach(input => {

                input.addEventListener('input', (e) => {

                    // تحديد index السطر بناءً على موقعه داخل DOM

                    const lineItem = e.target.closest('.description-line-item');

                    const allLineItems = Array.from(sectionElement.querySelectorAll('.description-line-item'));

                    const lineIdx = allLineItems.indexOf(lineItem);

                    if (lineIdx === -1) return; // حماية في حالة عدم العثور على السطر

                    if (e.target.classList.contains('line-type-select')) {

                        productDetailsSections[index].lines[lineIdx].type = e.target.value;

                    } else { // line-content-textarea

                        productDetailsSections[index].lines[lineIdx].content = e.target.value;

                    }

                    updateSaveButtonState();

                });

            });

            // معالج حدث زر إضافة سطر جديد

            sectionElement.querySelector('.add-description-line-btn').addEventListener('click', () => {

                if (!productDetailsSections[index].lines) {

                    productDetailsSections[index].lines = [];

                }

                productDetailsSections[index].lines.push({ type: 'paragraph', content: '' });

                renderSections(); // إعادة رسم الأقسام لتحديث الواجهة

                updateSaveButtonState();

            });

            // معالجات أحداث أزرار حذف السطر

            sectionElement.querySelectorAll('.remove-line-btn').forEach(btn => {

                btn.addEventListener('click', (e) => {

                    const lineItem = e.target.closest('.description-line-item');

                    const allLineItems = Array.from(sectionElement.querySelectorAll('.description-line-item'));

                    const lineIdx = allLineItems.indexOf(lineItem);

                    if (lineIdx === -1) return; // حماية

                    if (productDetailsSections[index].lines && productDetailsSections[index].lines.length > lineIdx) {

                        productDetailsSections[index].lines.splice(lineIdx, 1);

                        renderSections(); // إعادة رسم الأقسام

                        updateSaveButtonState();

                    }

                });

            });

            break;

        case 'images':

            const imageInput = sectionElement.querySelector('input[type="file"]');

            imageInput.addEventListener('change', async (e) => {

                const files = Array.from(e.target.files);

                for (const file of files) {

                    if (file) {

                        const reader = new FileReader();

                        reader.onload = (event) => {

                            if (!productDetailsSections[index].images) {

                                productDetailsSections[index].images = [];

                            }

                            productDetailsSections[index].images.push(event.target.result);

                            renderSections(); // إعادة رسم الأقسام لتحديث المعرض

                            updateSaveButtonState();

                        };

                        reader.readAsDataURL(file);

                    }

                }

            });

            // معالجات أحداث أزرار حذف الصور

            sectionElement.querySelectorAll('.remove-image-btn').forEach(btn => {

                btn.addEventListener('click', (e) => {

                    const imgIdx = parseInt(e.currentTarget.dataset.imageIndex);

                    if (productDetailsSections[index].images && productDetailsSections[index].images.length > imgIdx) {

                        productDetailsSections[index].images.splice(imgIdx, 1);

                        renderSections(); // إعادة رسم الأقسام لتحديث المعرض

                        updateSaveButtonState();

                    }

                });

            });

            break;

        case 'info_card':

            // معالجات أحداث حقول المفتاح والقيمة

            sectionElement.querySelectorAll('.info-card-item input').forEach(input => {

                input.addEventListener('input', (e) => {

                    // تحديد index البند بناءً على موقعه داخل DOM

                    const infoItem = e.target.closest('.info-card-item');

                    const allInfoItems = Array.from(sectionElement.querySelectorAll('.info-card-item'));

                    const itemIdx = allInfoItems.indexOf(infoItem);

                    if (itemIdx === -1) return; // حماية

                    if (e.target.placeholder.includes('المفتاح')) {

                        productDetailsSections[index].items[itemIdx].key = e.target.value;

                    } else {

                        productDetailsSections[index].items[itemIdx].value = e.target.value;

                    }

                    updateSaveButtonState();

                });

            });

            // معالج حدث زر إضافة بند جديد

            sectionElement.querySelector('.add-info-item-btn').addEventListener('click', () => {

                if (!productDetailsSections[index].items) {

                    productDetailsSections[index].items = [];

                }

                productDetailsSections[index].items.push({ key: '', value: '' });

                renderSections(); // إعادة رسم الأقسام لتحديث البطاقة

                updateSaveButtonState();

            });

            // معالجات أحداث أزرار حذف بند المعلومات

            sectionElement.querySelectorAll('.remove-info-item-btn').forEach(btn => {

                btn.addEventListener('click', (e) => {

                    const infoItem = e.target.closest('.info-card-item');

                    const allInfoItems = Array.from(sectionElement.querySelectorAll('.info-card-item'));

                    const itemIdx = allInfoItems.indexOf(infoItem);

                    if (itemIdx === -1) return; // حماية

                    if (productDetailsSections[index].items && productDetailsSections[index].items.length > itemIdx) {

                        productDetailsSections[index].items.splice(itemIdx, 1);

                        renderSections(); // إعادة رسم الأقسام لتحديث البطاقة

                        updateSaveButtonState();

                    }

                });

            });

            break;

    }

}

// دالة لإعادة رسم جميع الأقسام

function renderSections() {

    sectionsContainer.innerHTML = ''; // مسح الأقسام الموجودة

    productDetailsSections.forEach((section, index) => {

        createSectionElement(section, index);

    });

    updateSaveButtonState();

}

// دالة لإضافة قسم جديد إلى مصفوفة البيانات

function addSection(type) {

    let newSection = { type: type, order: productDetailsSections.length };

    if (type === 'description') {

        newSection.lines = [{ type: 'paragraph', content: '' }]; // إضافة سطر افتراضي للوصف

    } else if (type === 'images') {

        newSection.images = [];

    } else if (type === 'info_card') {

        newSection.items = [{ key: '', value: '' }]; // إضافة بند افتراضي

    }

    productDetailsSections.push(newSection);

    renderSections();

}

// دالة لحذف قسم من مصفوفة البيانات

function deleteSection(index) {

    productDetailsSections.splice(index, 1);

    // تحديث ترتيب الأقسام بعد الحذف

    productDetailsSections.forEach((section, idx) => {

        section.order = idx;

    });

    renderSections();

}

// دالة لتمكين/تعطيل زر الحفظ

function updateSaveButtonState() {

    if (selectedProductId && productDetailsSections.length > 0) {

        // التأكد من أن هناك محتوى فعلي في الأقسام قبل التمكين

        const hasContent = productDetailsSections.some(section => {

            if (section.type === 'description' && section.lines) {

                return section.lines.some(line => line.content && line.content.trim() !== '');

            }

            if (section.type === 'images' && section.images) {

                return section.images.length > 0;

            }

            if (section.type === 'info_card' && section.items) {

                return section.items.some(item => item.key && item.value);

            }

            return false;

        });

        saveProductDetailsButton.disabled = !hasContent;

    } else {

        saveProductDetailsButton.disabled = true;

    }

}

// دالة لجلب المنتجات لعرضها في قائمة الاختيار

async function fetchProductsForSelection() {

    if (!currentUserId) {

        console.warn("User ID not available yet for fetching products.");

        return;

    }

    const productsCollectionRef = collection(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/products`);

    onSnapshot(productsCollectionRef, (snapshot) => {

        productIdSelect.innerHTML = '<option value="">-- اختر منتجًا --</option>';

        snapshot.forEach(doc => {

            const product = { id: doc.id, ...doc.data() };

            const option = document.createElement('option');

            option.value = product.id;

            option.textContent = product.name || `منتج بدون اسم (${product.id.substring(0, 5)}...)`;

            productIdSelect.appendChild(option);

        });

        // إذا كان هناك منتج محدد سابقاً، حاول إعادة تحديده

        if (selectedProductId) {

            productIdSelect.value = selectedProductId;

            const selectedOption = productIdSelect.querySelector(`option[value="${selectedProductId}"]`);

            if (selectedOption) {

                selectedProductNameDisplay.textContent = `المنتج المحدد: ${selectedOption.textContent}`;

                selectedProductNameDisplay.classList.remove('hidden');

            } else {

                selectedProductId = null; // المنتج السابق لم يعد موجوداً

                selectedProductNameDisplay.classList.add('hidden');

                selectedProductNameDisplay.textContent = '';

                productDetailsSections = []; // مسح الأقسام إذا لم يعد المنتج موجوداً

                renderSections();

            }

        }

        updateSaveButtonState();

    }, (error) => {

        console.error("خطأ في جلب المنتجات لقائمة الاختيار:", error);

    });

}

// دالة لجلب تفاصيل المنتج الديناميكية عند تحديد منتج

async function fetchDynamicProductDetails(productId) {

    productDetailsSections = []; // مسح الأقسام الحالية

    sectionsContainer.innerHTML = ''; // مسح الواجهة

    if (!productId) {

        updateSaveButtonState();

        return;

    }

    openModal('جاري التحميل', 'جاري جلب تفاصيل المنتج...', [], true);

    try {

        const docRef = doc(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/productDetails`, productId);

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {

            const data = docSnap.data();

            productDetailsSections = data.sections || [];

            // فرز الأقسام حسب الترتيب إذا كان موجوداً

            productDetailsSections.sort((a, b) => (a.order || 0) - (b.order || 0));

        } else {

            // لا توجد تفاصيل موجودة لهذا المنتج

            // لا نفتح مودال هنا، فقط نمسح الأقسام وننتظر الإضافة

            // openModal('لا توجد تفاصيل', 'لا توجد تفاصيل ديناميكية لهذا المنتج بعد. يمكنك البدء في إضافتها.', [{ text: 'موافق', className: 'bg-blue-500 text-white', onClick: closeModal }]);

        }

        renderSections(); // عرض الأقسام التي تم جلبها

    } catch (error) {

        console.error("خطأ في جلب تفاصيل المنتج الديناميكية:", error);

        openModal('خطأ', `فشل جلب التفاصيل: ${error.message}`, [{ text: 'حسناً', className: 'bg-red-500 text-white', onClick: closeModal }]);

    } finally {

        closeModal();

        updateSaveButtonState();

    }

}

// دالة لحفظ تفاصيل المنتج الديناميكية

async function saveDynamicProductDetails() {

    if (!selectedProductId) {

        openModal('خطأ', 'الرجاء اختيار منتج قبل حفظ التفاصيل.', [{ text: 'حسناً', className: 'bg-red-500 text-white', onClick: closeModal }]);

        return;

    }

    openModal('جاري الحفظ', 'جاري حفظ تفاصيل المنتج...', [], true);

    try {

        // تنظيف البيانات قبل الحفظ (إزالة الحقول الفارغة في Info Card و Description lines مثلاً)

        const cleanedSections = productDetailsSections.map(section => {

            if (section.type === 'info_card' && section.items) {

                section.items = section.items.filter(item => item.key && item.value);

            }

            if (section.type === 'description' && section.lines) {

                section.lines = section.lines.filter(line => line.content && line.content.trim() !== '');

            }

            return section;

        }).filter(section => { // حذف الأقسام الفارغة تماماً بعد التنظيف

            if (section.type === 'description') return section.lines && section.lines.length > 0;

            if (section.type === 'images') return section.images && section.images.length > 0;

            if (section.type === 'info_card') return section.items && section.items.length > 0;

            return false; // لا نحفظ الأقسام من أنواع غير معروفة أو فارغة

        });

        const docRef = doc(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/productDetails`, selectedProductId);

        await setDoc(docRef, { sections: cleanedSections || [] }); // استخدام setDoc للكتابة أو التحديث

        openModal('نجاح', 'تم حفظ تفاصيل المنتج بنجاح!', [{ text: 'موافق', className: 'bg-blue-500 text-white', onClick: closeModal }]);

    } catch (error) {

        console.error("خطأ في حفظ تفاصيل المنتج الديناميكية:", error);

        openModal('خطأ', `فشل حفظ التفاصيل: ${error.message}`, [{ text: 'حسناً', className: 'bg-red-500 text-white', onClick: closeModal }]);

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

    

    // تعيين عناصر DOM الخاصة ببناء التفاصيل

    productIdSelect = document.getElementById('productIdSelect');

    selectedProductNameDisplay = document.getElementById('selectedProductName');

    sectionsContainer = document.getElementById('sectionsContainer');

    addSectionButton = document.getElementById('addSectionButton');

    addSectionOptions = document.getElementById('addSectionOptions');

    saveProductDetailsButton = document.getElementById('saveProductDetails');

    

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

    // ** Event Listeners for Dynamic Product Details Builder **

    // زر إضافة قسم جديد

    if (addSectionButton) {

        addSectionButton.addEventListener('click', (event) => {

            event.stopPropagation(); // منع إغلاق القائمة فوراً

            addSectionOptions.classList.toggle('show');

        });

        // إغلاق قائمة الخيارات عند النقر خارجها

        document.addEventListener('click', (event) => {

            if (addSectionOptions && addSectionButton && !addSectionOptions.contains(event.target) && !addSectionButton.contains(event.target)) {

                addSectionOptions.classList.remove('show');

            }

        });

    }

    // خيارات إضافة القسم (وصف، صور، بطاقة)

    if (addSectionOptions) {

        addSectionOptions.querySelectorAll('button').forEach(button => {

            button.addEventListener('click', (e) => {

                const type = e.currentTarget.dataset.type;

                addSection(type);

                addSectionOptions.classList.remove('show'); // إخفاء القائمة بعد الاختيار

            });

        });

    }

    // اختيار المنتج من القائمة المنسدلة

    if (productIdSelect) {

        productIdSelect.addEventListener('change', (e) => {

            selectedProductId = e.target.value;

            const selectedOptionText = e.target.options[e.target.selectedIndex].textContent;

            if (selectedProductId) {

                selectedProductNameDisplay.textContent = `المنتج المحدد: ${selectedOptionText}`;

                selectedProductNameDisplay.classList.remove('hidden');

                fetchDynamicProductDetails(selectedProductId);

            } else {

                selectedProductNameDisplay.classList.add('hidden');

                selectedProductNameDisplay.textContent = '';

                productDetailsSections = []; // مسح الأقسام عند عدم اختيار منتج

                renderSections();

            }

            updateSaveButtonState();

        });

    }

    // زر حفظ تفاصيل المنتج

    if (saveProductDetailsButton) {

        saveProductDetailsButton.addEventListener('click', saveDynamicProductDetails);

    }

    // Firebase Auth State Listener for this page

    onAuthStateChanged(auth, async (user) => {

        try {

            if (user) {

                currentUserId = user.uid;

                if (userIdDisplay) userIdDisplay.textContent = `هوية المستخدم: ${currentUserId}`;

                await fetchProductsForSelection(); // جلب المنتجات لملء قائمة الاختيار

            } else {

                try {

                    await signInAnonymously(auth);

                } catch (authError) {

                    console.error("خطأ في تسجيل الدخول (مجهول):", authError);

                    if (userIdDisplay) userIdDisplay.textContent = `فشل المصادقة: ${authError.message}`;

                    if (sectionsContainer) sectionsContainer.innerHTML = '<p class="text-center text-red-600 text-lg">تعذر تسجيل الدخول للمتابعة.</p>';

                }

            }

        } finally {

            // لا شيء هنا

        }

    });

});