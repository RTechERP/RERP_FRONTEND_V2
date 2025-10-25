import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { Router } from '@angular/router';  
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
interface IqQuestion {
  id: string;
  text?: string;
  image?: string;
  options?: IqOption[];
  correctIndex?: number;      
  answerText?: string;     
  type: 'mcq' | 'text';
}

interface IqAnswerSelection {
  questionId: string;
  selectedOptionIndex?: number; 
  answerText?: string;          
}
interface IqOption {
  text?: string;
  image?: string;
}
@Component({
  selector: 'app-test-IQ',
  templateUrl: './test-IQ.component.html',
  styleUrls: ['./test-IQ.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzInputModule,
    NzGridModule,
    NzProgressModule,
    NzRadioModule,
    NzAlertModule,
    NzIconModule,
    NzDividerModule,
    NzTypographyModule,
    NzModalModule,
    NzFormModule,
    NzDatePickerModule
  ]
})
export class TestIQComponent implements OnInit {
  isReview = false;
  showThankYou = false;
  candidateName = '';
  email = '';
  phone = '';
  address = '';
  position = '';
  dob: Date | null = null;
  isModalVisible = true;
  startedAt: Date | null = null;
  submittedAt: Date | null = null;
  timeLimitMinutes = 15;
  get totalSeconds(): number { return this.timeLimitMinutes * 60; }
  remainingSeconds = this.timeLimitMinutes * 60;
  timerId: any;
  text?: string; 
  questions: IqQuestion[] = [
  { 
    id: 'q1',
    text: 'Chọn đáp án đúng?',
    image: 'assets/1.jpg', 
    options: [
      { image: 'assets/questions/q1.jpg',text: 'A' }, 
      { image: 'assets/questions/q2.jpg',text: 'B' }, 
      { image: 'assets/questions/q3.jpg',text: 'C' }, 
      { image: 'assets/questions/q4.jpg',text: 'D' }
    ],
    correctIndex: 3,
     type: 'mcq'
  },
  { 
    id: 'q2', 
    text: 'Ký tự tiếp theo trong dãy sau đây là ký tự nào: A…C…F…J…O…?', 
    options: [
      { text: 'S' }, 
      { text: 'T' }, 
      { text: 'U' }, 
      { text: 'V' }
    ], 
    correctIndex: 2,
    type: 'mcq' 
  },
  { 
    id: 'q3', 
    text: 'Hãy điền số còn thiếu vào chỗ dấu chấm hỏi?', 
    image: 'assets/c3.jpg',
    options: [
      { text: '5' }, 
      { text: '10' }, 
      { text: '25' }, 
      { text: '4' }
    ], 
    correctIndex: 0,
    type: 'mcq'
  },
  { 
    id: 'q4', 
    text: 'Chọn đáp án đúng?',
    image: 'assets/c4.jpg', 
     options: [
      { image: 'assets/questions/c4_1.jpg',text: 'A' }, 
      { image: 'assets/questions/c4_2.jpg',text: 'B' }, 
      { image: 'assets/questions/c4_3.jpg',text: 'C' }, 
      { image: 'assets/questions/c4_4.jpg',text: 'D' }
    ],
    correctIndex: 3,
    type: 'mcq'
  },
  { 
    id: 'q5', 
    text: 'Chọn đáp án đúng?', 
    image: 'assets/c5.jpg',
    options: [
      { image: 'assets/questions/c5_1.jpg',text: 'A' }, 
      { image: 'assets/questions/c5_2.jpg',text: 'B' }, 
      { image: 'assets/questions/c5_3.jpg',text: 'C' }, 
      { image: 'assets/questions/c5_4.jpg',text: 'D' }
    ], 
    correctIndex: 1,
    type: 'mcq'
  },
  { 
    id: 'q6', 
    text: 'Chọn đáp án đúng?', 
    image: 'assets/c6.jpg',
    options: [
      { image: 'assets/questions/c6_1.jpg',text: 'A' }, 
      { image: 'assets/questions/c6_2.jpg',text: 'B' }, 
      { image: 'assets/questions/c6_3.jpg',text: 'C' }, 
      { image: 'assets/questions/c6_4.jpg',text: 'D' }
    ], 
    correctIndex: 1,
    type: 'mcq'
  },
  { 
    id: 'q7', 
    text: 'Hình nào là hình xoay của vật?', 
    image: 'assets/c7.jpg',
    options: [
      { image: 'assets/questions/c7_1.jpg',text: 'A' }, 
      { image: 'assets/questions/c7_2.jpg',text: 'B' }, 
      { image: 'assets/questions/c7_3.jpg',text: 'C' }, 
      { image: 'assets/questions/c7_4.jpg',text: 'D' }
    ], 
    correctIndex: 0,
    type: 'mcq'
  },
  { 
    id: 'q8', 
    text: 'Hình nào là hình nhìn từ trên xuống của vật đã cho?', 
    image: 'assets/c8.jpg',
    options: [
      { image: 'assets/questions/c8_1.jpg',text: 'A' }, 
      { image: 'assets/questions/c8_2.jpg',text: 'B' }, 
      { image: 'assets/questions/c8_3.jpg',text: 'C' }, 
      { image: 'assets/questions/c8_4.jpg',text: 'D' }
    ], 
    correctIndex: 1,
    type: 'mcq'
  },
  { 
    id: 'q9', 
    text: 'Mảnh nào tương ứng với vật thể đã cho?', 
    image: 'assets/c9.jpg',
    options: [
      { image: 'assets/questions/c9_1.jpg',text: 'A' }, 
      { image: 'assets/questions/c9_2.jpg',text: 'B' }, 
      { image: 'assets/questions/c9_3.jpg',text: 'C' }, 
      { image: 'assets/questions/c9_4.jpg',text: 'D' }
    ], 
    correctIndex: 2,
    type: 'mcq'
  },
  { 
    id: 'q10', 
    text: 'Nhóm hình trên còn thiếu hình nào trong số các hình sau?', 
    image: 'assets/c10.jpg',
    options: [
      { image: 'assets/questions/c10_1.jpg' }, 
      { image: 'assets/questions/c10_2.jpg' }, 
      { image: 'assets/questions/c10_3.jpg' }, 
      { image: 'assets/questions/c10_4.jpg' }
    ], 
    correctIndex: 2,
    type: 'mcq'
  },
  { 
      id: 'q11', 
      text: 'Số nào sẽ là số tiếp theo? 0, 4, 2, 6, 3, 7, 3.5, ?', 
      type: 'text',
      answerText: '7.5'
 },
  { 
    id: 'q12', 
    text: 'Nhìn các hàng ngang và dọc, nếu hai ô hình đầu tiên hợp với nhau để tạo thành hình thứ 3, trừ trường hợp các ký hiệu giống nhau sẽ triệt tiêu nhau khi kết hợp. Vậy ô hình nào ở trên kết hợp không đúng và phải thay thế bằng ô hình nào dưới đây?', 
    image: 'assets/c12.jpg',
    options: [
      { image: 'assets/questions/c12_1.jpg',text: 'A' }, 
      { image: 'assets/questions/c12_2.jpg',text: 'B' }, 
      { image: 'assets/questions/c12_3.jpg',text: 'C' }, 
      { image: 'assets/questions/c12_4.jpg',text: 'D' },
      { image: 'assets/questions/c12_5.jpg',text: 'E' }
    ], 
    correctIndex: 1,
    type: 'mcq'
  },
  { 
      id: 'q13', 
      text: 'Số nào sẽ thay cho dấu chấm hỏi?',
      image: 'assets/c13.jpg', 
      type: 'text',
      answerText: '17'
 },
  { 
      id: 'q14', 
      text: 'Số nào sẽ thay cho dấu chấm hỏi?',
      image: 'assets/c14.jpg', 
      type: 'text',
      answerText: '8'
 },
   { 
      id: 'q15', 
      text: 'Trước 12 giờ trưa là bao nhiêu phút? Nếu trước đó 9 phút số phút này gấp hai lần số phút sau 10 giờ sáng?', 
      type: 'text',
      answerText: '71'
 },
  { 
      id: 'q16', 
      text: 'Số còn thiếu ở chỗ dấu chấm hỏi là số nào?',
      image: 'assets/c17.jpg', 
      type: 'text',
      answerText: '4'
 },
 { 
      id: 'q17 ', 
      text: 'Số còn thiếu ở chỗ dấu chấm hỏi là số nào?',
      image: 'assets/c18.jpg', 
      type: 'text',
      answerText: '9'
 },
 { 
    id: 'q18', 
    text: 'Tìm số thích hợp điền vào chỗ trống.', 
    image: 'assets/c19.jpg',
    options: [
      { text: '7' }, 
      { text: '8' }, 
      { text: '6' }, 
      { text: '9' }
    ], 
    correctIndex: 3,
    type: 'mcq'
  },
  { 
    id: 'q19', 
    text: 'Điền vào chỗ dấu hỏi hình thích hợp?', 
    image: 'assets/c20.jpg',
    options: [
      { image: 'assets/questions/c20_1.jpg',text: 'A' }, 
      { image: 'assets/questions/c20_2.jpg',text: 'B' }, 
      { image: 'assets/questions/c20_3.jpg',text: 'C' }, 
      { image: 'assets/questions/c20_4.jpg',text: 'D' }
  
    ], 
    correctIndex: 1,
    type: 'mcq'
  },
  { 
    id: 'q20', 
    text: 'Nhóm hình trên còn thiếu hình nào trong số các hình sau?', 
    image: 'assets/c10.jpg',
    options: [
      { image: 'assets/questions/c10_1.jpg' }, 
      { image: 'assets/questions/c10_2.jpg' }, 
      { image: 'assets/questions/c10_3.jpg' }, 
      { image: 'assets/questions/c10_4.jpg' }
    ], 
    correctIndex: 2,
    type: 'mcq'
  },
];

  selectedAnswers: Record<string, number | string> = {};
  submitted = false;
  score = 0;
  currentIndex = 0;
  constructor(private modal: NzModalService, private router: Router,private route: ActivatedRoute,private location: Location) {}

  showModal(): void {
    this.isModalVisible = true;
  }

  handleCancel(): void {
    this.isModalVisible = false;
  }

  closeModal(): void {
  this.isModalVisible = false;
  
  if (this.isReview) {
    this.location.back();
  } else {
    this.router.navigate(['/welcome']);
  }
}

  get currentQuestion(): IqQuestion {
    return this.questions[this.currentIndex];
  }

  ngOnInit(): void {
    // this.reset();
    const id = this.route.snapshot.paramMap.get('id');
  if (id) {
    this.loadSubmission(id);   
  } else {
    this.reset();              
  }
  }

  isInfoValid(): boolean {
    return !!(this.candidateName && this.phone && this.address && this.email && this.position);
  }
  get timerColor(): 'normal' | 'active' | 'success' | 'exception' {
  if (this.remainingSeconds <= 10) return 'exception'; 
  if (this.remainingSeconds <= 30) return 'active';    
  return 'normal';                                    
  }
  start(): void {
  if (this.startedAt || !this.isInfoValid()) return;
  this.startedAt = new Date();
  this.timerId = setInterval(() => {
    if (this.remainingSeconds > 0) {
      this.remainingSeconds -= 1;
    } else {
      this.submit(); 
      clearInterval(this.timerId);
    }
  }, 1000);
}
  currentQuestionHasImages(): boolean {
  return !!this.currentQuestion.options?.some(opt => !!opt.image);
}
  selectAnswer(questionId: string, optionIndex: number): void {
    this.selectedAnswers[questionId] = Number(optionIndex);
  }

  goTo(index: number): void {
    if (index < 0 || index >= this.questions.length) return;
    this.currentIndex = index;
  }

  next(): void { this.goTo(this.currentIndex + 1); }
  prev(): void { this.goTo(this.currentIndex - 1); }

  confirmSubmit(): void {
    const answeredCount = Object.keys(this.selectedAnswers).length;
    const totalQuestions = this.questions.length;

    this.modal.confirm({
      nzTitle: 'Xác nhận nộp bài',
      nzContent: `Bạn đã trả lời ${answeredCount}/${totalQuestions} câu hỏi. Bạn có chắc chắn muốn nộp bài không?`,
      nzOkText: 'Có, nộp bài',
      nzCancelText: 'Tiếp tục làm bài',
      nzOnOk: () => this.submit()
    });
  }

      submit(): void {
      if (this.submitted || this.showThankYou) return;

      // Dừng timer nếu có
      if (this.timerId) clearInterval(this.timerId);

      // Hiển thị màn hình cảm ơn trước
      this.showThankYou = true;
    }
    viewResult(): void {
      this.showThankYou = false;   
      this.submitted = true;      
      this.submittedAt = new Date();
      this.calculateScore();
      this.saveSubmission();
    }

  calculateScore() {
    this.score = 0;
    for (const q of this.questions) {
      const ans = this.selectedAnswers[q.id];
      if (q.type==='mcq' && ans===q.correctIndex) this.score++;
      else if (q.type==='text' && ans?.toString().trim()===q.answerText?.trim()) this.score++;
    }
  }

  saveSubmission(): void {
  const startedAt = this.startedAt ? this.startedAt.toISOString() : new Date().toISOString();
  const submittedAt = this.submittedAt ? this.submittedAt.toISOString() : new Date().toISOString();
  const durationSeconds = Math.max(0, (new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000) | 0;

  // Lưu câu trả lời đúng với loại câu hỏi
  const answers: IqAnswerSelection[] = this.questions.map(q => {
    const ans = this.selectedAnswers[q.id];
    if (q.type === 'mcq') {
      return { questionId: q.id, selectedOptionIndex: ans as number };
    } else if (q.type === 'text') {
      return { questionId: q.id, answerText: ans as string };
    } else {
      return { questionId: q.id };
    }
  });

  const submission = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    candidateName: this.candidateName || 'N/A',
    dob: this.dob ? new Date(this.dob).toISOString() : '',
    email: this.email || '',
    phone: this.phone || '',
    address: this.address || '',
    position: this.position || '',
    score: this.score,
    total: this.questions.length,
    startedAt,
    submittedAt,
    durationSeconds,
    answers,
  };

  try {
    const raw = localStorage.getItem('iq_submissions');
    const list = raw ? JSON.parse(raw) : [];
    list.push(submission);
    localStorage.setItem('iq_submissions', JSON.stringify(list));
  } catch (e) {
    console.error('Lỗi lưu submission', e);
  }
}


  getRemainingMmSs(): string { return this.formatRemaining(); }

  formatRemaining(): string {
    const m = Math.floor(this.remainingSeconds / 60).toString().padStart(2, '0');
    const s = Math.floor(this.remainingSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  get progressPercent(): number {
    const used = this.totalSeconds - this.remainingSeconds;
    return Math.max(0, Math.min(100, (used / this.totalSeconds) * 100));
  }

  getQuestionButtonClass(index: number): string {
    const question = this.questions[index];
    const isCurrent = this.currentIndex === index;
    const isAnswered = this.selectedAnswers[question.id] !== undefined;

    if (isCurrent) {
      return 'btn-current';
    } else if (isAnswered) {
      return 'btn-answered';
    } else {
      return 'btn-not-answered';
    }
  }

  reset(): void {
    this.startedAt = null;
    this.submittedAt = null;
    this.remainingSeconds = this.timeLimitMinutes * 60;
    this.submitted = false;
    
    this.selectedAnswers = {};
    this.currentIndex = 0;
    if (this.timerId) clearInterval(this.timerId);
  }
  loadSubmission(id: string): void {
  try {
    const raw = localStorage.getItem('iq_submissions');
    const list = raw ? JSON.parse(raw) : [];
    const submission = list.find((s: any) => s.id === id);
    if (submission) {
      this.candidateName = submission.candidateName;
      this.email = submission.email;
      this.phone = submission.phone;
      this.address = submission.address;
      this.position = submission.position;
      this.dob = submission.dob ? new Date(submission.dob) : null;

      this.score = submission.score;
      this.startedAt = new Date(submission.startedAt);
      this.submittedAt = new Date(submission.submittedAt);
      this.submitted = true;
      this.isReview = true;

      this.selectedAnswers = {};
      for (const ans of submission.answers) {
        if ('selectedOptionIndex' in ans) {
          this.selectedAnswers[ans.questionId] = ans.selectedOptionIndex;
        } else if ('answerText' in ans) {
          this.selectedAnswers[ans.questionId] = ans.answerText;
        }
      }
    }
  } catch (e) {
    console.error('Lỗi loadSubmission', e);
  }
}

}
