import { HOME_TEMPLATE, QUIZ_TEMPLATE, RESULTS_TEMPLATE } from './htmlTemplates';
import { escapeHtml } from '../utils/htmlEscape';

export function getHomePage(): string {
  return HOME_TEMPLATE;
}

export function getQuizPage(slug: string, session: any): string {
  return QUIZ_TEMPLATE
    .replace(/{{DOG_NAME}}/g, escapeHtml(session.dog_name))
    .replace(/{{SLUG}}/g, escapeHtml(slug))
    .replace(/{{PHOTO_DISPLAY}}/g, session.photo_url ? 'none' : 'block')
    .replace(/{{PHOTO_URL}}/g, session.photo_url ? escapeHtml(session.photo_url) : '');
}

export function getResultsPage(slug: string, sessionData: any): string {
  const scores = JSON.parse(sessionData.scores || '{}');
  const generatedImages = JSON.parse(sessionData.generated_images || '{}');
  
  // Build trait sections dynamically
  const traitSections = Object.entries(scores).map(([trait, data]: [string, any]) => `
    <div class="bg-white rounded-2xl shadow-xl p-8">
        <div class="text-center mb-6">
            <h2 class="text-3xl font-bold text-purple-800 mb-2">
                ${escapeHtml(data.emoji)} ${escapeHtml(trait.toUpperCase())} - ${escapeHtml(data.label)}
            </h2>
            <p class="text-lg text-gray-700 mb-4">${escapeHtml(data.description)}</p>
            <div class="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div class="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full" 
                     style="width: ${data.score}%"></div>
            </div>
            <span class="text-2xl font-bold text-purple-600">${data.score}/100</span>
        </div>
        
        ${generatedImages[trait] ? `
            <div class="text-center mb-6">
                <div class="relative inline-block">
                    <img src="/images/${escapeHtml(generatedImages[trait])}" 
                         alt="${escapeHtml(trait)} image for ${escapeHtml(sessionData.dog_name)}"
                         class="w-64 h-64 object-cover rounded-full shadow-lg"
                         onerror="this.onerror=null; this.src='data:image/svg%2Bxml;charset=utf-8,%3Csvg%20width%3D%22200%22%20height%3D%22200%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23E0E0E0%22%20rx%3D%22100%22/%3E%3Ctext%20x%3D%22100%22%20y%3D%22120%22%20font-family%3D%22Arial%22%20font-size%3D%2240%22%20text-anchor%3D%22middle%22%20fill%3D%22%23333%22%3E%E2%97%86%3C/text%3E%3Ctext%20x%3D%22100%22%20y%3D%22150%22%20font-family%3D%22Arial%22%20font-size%3D%2214%22%20text-anchor%3D%22middle%22%20fill%3D%22%23333%22%3EDog%3C/text%3E%3C/svg%3E';">
                    <div class="absolute -top-2 -right-2">
                        <span class="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                            ${escapeHtml(data.label)}
                        </span>
                    </div>
                </div>
                <div class="mt-4 space-x-4">
                    <button onclick="regenerateImage('${escapeHtml(trait)}')" 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                        🎨 New Image
                    </button>
                    <button onclick="shareImage('${escapeHtml(trait)}')" 
                            class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                        📱 Share Image
                    </button>
                </div>
            </div>
        ` : `
            <div class="text-center mb-6">
                <div class="relative inline-block">
                    <div class="w-64 h-64 bg-gray-200 rounded-full shadow-lg flex items-center justify-center">
                        <div class="text-center">
                            <div class="text-6xl mb-2">${escapeHtml(data.emoji)}</div>
                            <div class="text-gray-600 font-semibold">${escapeHtml(data.label)}</div>
                        </div>
                    </div>
                    <div class="absolute -top-2 -right-2">
                        <span class="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                            ${escapeHtml(data.label)}
                        </span>
                    </div>
                </div>
                <div class="mt-4">
                    <button onclick="regenerateImage('${escapeHtml(trait)}')" 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                        🎨 Generate Image
                    </button>
                </div>
            </div>
        `}
        
        <div class="text-center">
            <button onclick="askAboutTrait('${escapeHtml(trait)}')" 
                    class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg">
                💬 Ask about ${escapeHtml(trait)}
            </button>
        </div>
    </div>
  `).join('');
  
  return RESULTS_TEMPLATE
    .replace(/{{TITLE}}/g, escapeHtml(sessionData.title))
    .replace(/{{DOG_NAME}}/g, escapeHtml(sessionData.dog_name))
    .replace(/{{SUMMARY}}/g, escapeHtml(sessionData.summary))
    .replace(/{{SLUG}}/g, escapeHtml(slug))
    .replace(/{{TRAIT_SECTIONS}}/g, traitSections)
    .replace(/{{GENERATED_IMAGES_JSON}}/g, JSON.stringify(generatedImages));
}