/**
 * 객체를 배열로 변환하는 유틸리티 함수
 * applicationFormTemplate이 객체인 경우 배열로 변환
 */
export function ensureArray<T>(data: any): T[] {
  if (!data) return [];
  
  if (Array.isArray(data)) {
    return data;
  }
  
  if (typeof data === 'object') {
    return Object.values(data);
  }
  
  return [];
}

/**
 * Post의 applicationFormTemplate을 안전하게 배열로 변환
 */
export function getSafeApplicationFormTemplate(post: any): any[] {
  if (!post?.applicationFormTemplate) return [];
  
  return ensureArray(post.applicationFormTemplate);
}


