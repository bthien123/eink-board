// Du lieu that tuan 21-27/09/2026, dung de xem truoc va doi chieu voi ban Python.
const SAMPLE_WEEK = [
  {
    "date": "21/09",
    "weekday_vi": "THỨ HAI",
    "morning": [
      [
        "07:45",
        "Hoạt động trải nghiệm 1"
      ],
      [
        "08:25",
        "Hoạt động trải nghiệm 2"
      ],
      [
        "09:10",
        "Toán"
      ],
      [
        "09:50",
        "Tiếng Việt"
      ],
      [
        "10:25",
        "Khoa học"
      ]
    ],
    "afternoon": [
      [
        "14:00",
        "Mĩ thuật"
      ],
      [
        "14:50",
        "Toán SN"
      ],
      [
        "15:40",
        "STEM"
      ]
    ],
    "items": [
      [
        "06:30",
        "Uống Bright Vision (sau bữa sáng)"
      ],
      [
        "16:45",
        "Chơi tự do sau giờ học"
      ],
      [
        "19:00",
        "Làm bài tập trên lớp"
      ],
      [
        "19:30",
        "Uống Bright Vision (sau bữa tối)"
      ],
      [
        "20:15",
        "Edupia AI - Lớp học"
      ],
      [
        "21:20",
        "Nhỏ mắt Atropine (trước khi ngủ)"
      ]
    ]
  },
  {
    "date": "22/09",
    "weekday_vi": "THỨ BA",
    "morning": [
      [
        "07:45",
        "Giáo dục thể chất"
      ],
      [
        "08:25",
        "Toán"
      ],
      [
        "09:10",
        "Tiếng Việt"
      ],
      [
        "09:50",
        "Tiếng Việt"
      ],
      [
        "10:25",
        "Công nghệ"
      ]
    ],
    "afternoon": [
      [
        "14:00",
        "Tiếng Anh"
      ],
      [
        "14:50",
        "Toán SN"
      ],
      [
        "15:40",
        "Tiếng Việt"
      ]
    ],
    "items": [
      [
        "06:30",
        "Uống Bright Vision (sau bữa sáng)"
      ],
      [
        "16:45",
        "Chơi tự do sau giờ học"
      ],
      [
        "19:00",
        "Làm bài tập trên lớp"
      ],
      [
        "19:30",
        "Uống Bright Vision (sau bữa tối)"
      ],
      [
        "21:20",
        "Nhỏ mắt Atropine (trước khi ngủ)"
      ]
    ]
  },
  {
    "date": "23/09",
    "weekday_vi": "THỨ TƯ",
    "morning": [
      [
        "07:45",
        "Toán"
      ],
      [
        "08:25",
        "Tiếng Việt"
      ],
      [
        "09:10",
        "TANN (Tăng cường Anh ngữ)"
      ],
      [
        "09:50",
        "TANN (Tăng cường Anh ngữ)"
      ],
      [
        "10:25",
        "Khoa học"
      ]
    ],
    "afternoon": [
      [
        "14:00",
        "Tin học"
      ],
      [
        "14:50",
        "Tiếng Anh"
      ],
      [
        "15:40",
        "ATGT (An toàn giao thông)"
      ]
    ],
    "items": [
      [
        "06:30",
        "Uống Bright Vision (sau bữa sáng)"
      ],
      [
        "16:45",
        "Chơi tự do sau giờ học"
      ],
      [
        "19:00",
        "Làm bài tập trên lớp"
      ],
      [
        "19:30",
        "Uống Bright Vision (sau bữa tối)"
      ],
      [
        "21:20",
        "Nhỏ mắt Atropine (trước khi ngủ)"
      ]
    ]
  },
  {
    "date": "24/09",
    "weekday_vi": "THỨ NĂM",
    "morning": [
      [
        "07:45",
        "Toán"
      ],
      [
        "08:25",
        "Tiếng Việt"
      ],
      [
        "09:10",
        "TANN (Tăng cường Anh ngữ)"
      ],
      [
        "09:50",
        "TANN (Tăng cường Anh ngữ)"
      ],
      [
        "10:25",
        "KHSN (Kỹ năng sống)"
      ]
    ],
    "afternoon": [
      [
        "14:00",
        "Lịch sử & Địa lý"
      ],
      [
        "14:50",
        "Âm nhạc"
      ],
      [
        "15:40",
        "Tiếng Việt"
      ]
    ],
    "items": [
      [
        "06:30",
        "Uống Bright Vision (sau bữa sáng)"
      ],
      [
        "16:45",
        "Chơi tự do sau giờ học"
      ],
      [
        "19:00",
        "Làm bài tập trên lớp"
      ],
      [
        "19:30",
        "Uống Bright Vision (sau bữa tối)"
      ],
      [
        "20:15",
        "Edupia AI - Lớp học"
      ],
      [
        "21:20",
        "Nhỏ mắt Atropine (trước khi ngủ)"
      ]
    ]
  },
  {
    "date": "25/09",
    "weekday_vi": "THỨ SÁU",
    "morning": [
      [
        "07:45",
        "Tiếng Anh"
      ],
      [
        "08:25",
        "Toán"
      ],
      [
        "09:10",
        "Giáo dục thể chất"
      ],
      [
        "09:50",
        "GDDP (Giáo dục địa phương)"
      ],
      [
        "10:25",
        "Đạo đức"
      ]
    ],
    "afternoon": [
      [
        "14:00",
        "Lịch sử & Địa lý"
      ],
      [
        "14:50",
        "Tiếng Anh"
      ],
      [
        "15:40",
        "Hoạt động trải nghiệm 3"
      ]
    ],
    "items": [
      [
        "06:30",
        "Uống Bright Vision (sau bữa sáng)"
      ],
      [
        "16:45",
        "Chơi tự do sau giờ học"
      ],
      [
        "19:00",
        "Làm bài tập trên lớp"
      ],
      [
        "19:30",
        "Uống Bright Vision (sau bữa tối)"
      ],
      [
        "21:20",
        "Nhỏ mắt Atropine (trước khi ngủ)"
      ]
    ]
  },
  {
    "date": "26/09",
    "weekday_vi": "THỨ BẢY",
    "morning": [],
    "afternoon": [],
    "items": [
      [
        "06:30",
        "Uống Bright Vision (sau bữa sáng)"
      ],
      [
        "10:00",
        "Robotic - MindX Quảng Ninh"
      ],
      [
        "15:00",
        "Edupia AI - Làm bài tập tuần"
      ],
      [
        "19:30",
        "Uống Bright Vision (sau bữa tối)"
      ],
      [
        "21:20",
        "Nhỏ mắt Atropine (trước khi ngủ)"
      ]
    ]
  },
  {
    "date": "27/09",
    "weekday_vi": "CHỦ NHẬT",
    "morning": [],
    "afternoon": [],
    "items": [
      [
        "06:30",
        "Uống Bright Vision (sau bữa sáng)"
      ],
      [
        "08:30",
        "Vận động ngoài trời"
      ],
      [
        "09:00",
        "VioEdu - Vòng sơ loại 1"
      ],
      [
        "19:30",
        "Uống Bright Vision (sau bữa tối)"
      ],
      [
        "21:20",
        "Nhỏ mắt Atropine (trước khi ngủ)"
      ]
    ]
  }
];
