import { Metadata } from "next"

import { PageContainer } from "@/components/layout/PageContainer"
import { getAppName } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Nguồn tham khảo",
  description: "Các trang web, cộng đồng và nguồn tài liệu uy tín về anime và diễn hoạt (sakuga) được chúng tôi tin tưởng và sử dụng.",
}

const RESOURCES = [
  {
    url: "https://blog.sakugabooru.com/",
    domain: "blog.sakugabooru.com",
    description: "Blog chuyên sâu về sakuga uy tín bậc nhất trong cộng đồng, cung cấp góc nhìn chuyên môn về hoạt hình và ngành công nghiệp anime. Đây cũng là nguồn tài liệu mà bọn mình tham khảo rất nhiều cho các bài viết.",
  },
  {
    url: "https://www.sakugabooru.com/",
    domain: "sakugabooru.com",
    description: "Thư viện lưu trữ và tổng hợp các đoạn clip (cut) sakuga đỉnh cao từ mọi bộ anime, giúp người xem dễ dàng chiêm ngưỡng kỹ năng của các họa sĩ diễn hoạt (animator).",
  },
  {
    url: "https://keyframe-stafflist.com/",
    domain: "keyframe-stafflist.com",
    description: "Trang web hàng đầu để theo dõi thông tin nhân sự (staff) và credit của các bộ anime dành cho những ai không rành tiếng Nhật. Giao diện trực quan, thông tin được trình bày đẹp mắt và vô cùng đầy đủ nhờ vào đội ngũ quản trị tâm huyết và cống hiến.",
  },
  {
    url: "#",
    domain: "Các tạp chí và nền tảng truyền thông (Febri, Animage, Newtype...)",
    description: "Rất nhiều thông tin giá trị đến từ các bài phỏng vấn không cố định trên các tạp chí chuyên đề hoặc báo điện tử. Cách tốt nhất để theo dõi là cập nhật thông tin từ tài khoản X (Twitter) chính thức của từng bộ anime, nơi họ sẽ đăng tải các liên kết phỏng vấn công khai mỗi khi có bài mới.",
    isLink: false
  },
  {
    url: "https://www.animenewsnetwork.com/",
    domain: "animenewsnetwork.com",
    description: "Nguồn tin tức anime quốc tế uy tín, đồng thời là một bách khoa toàn thư để tra cứu nhân sự tham gia sản xuất và tin tức chung.",
  },
  {
    url: "https://anidb.net/",
    domain: "anidb.net",
    description: "Cơ sở dữ liệu đồ sộ để theo dõi staff. Dù thông tin đôi khi được cập nhật đầy đủ hơn cả ANN, nhưng tốc độ cập nhật với các bộ mới thường khá chậm. Nhìn chung, bọn mình vẫn ưu tiên sử dụng keyframe-stafflist hơn cho mục đích tra cứu.",
  },
  {
    url: "https://anilist.co/",
    domain: "anilist.co",
    description: "Nền tảng tuyệt vời để theo dõi lịch chiếu phim, quản lý danh sách anime/manga đang xem, cũng như tương tác với cộng đồng người hâm mộ.",
  },
]

export default function ResourcesPage() {
  const appName = getAppName()

  return (
    <PageContainer>
      <section className="mb-12">
        <h1 className="text-[32px] font-bold leading-tight tracking-tight md:text-[40px]">
          Nguồn tham khảo
        </h1>
        <p className="mt-4 text-[15px] text-text-secondary md:text-[16px] leading-relaxed max-w-3xl">
          Dưới đây là danh sách các trang web, thư viện lưu trữ và cộng đồng uy tín mà {appName} thường xuyên tham khảo để thu thập thông tin, nghiên cứu chuyên sâu về hoạt hình và ngành công nghiệp anime.
        </p>
      </section>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {RESOURCES.map((resource, index) => (
          <div
            key={index}
            className="group flex flex-col rounded-[12px] border border-border-default bg-subtle-bg/30 p-5 transition-all hover:border-accent/40 hover:bg-subtle-bg/60 hover:shadow-sm"
          >
            {resource.isLink === false ? (
              <h3 className="mb-2 text-[15px] font-semibold text-text-primary">
                {resource.domain}
              </h3>
            ) : (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-2 inline-flex items-center text-[15px] font-semibold text-text-primary hover:text-accent transition-colors"
              >
                {resource.domain}
                <svg
                  className="ml-1.5 h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-opacity"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            )}
            <p className="text-[14px] leading-relaxed text-text-secondary mt-auto">
              {resource.description}
            </p>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
