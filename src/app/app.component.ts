import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from './dialog/dialog.component';
import { CookieService } from 'ngx-cookie-service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(
    public dialog: MatDialog,
    private cookieService: CookieService,
    private http: HttpClient,
    private formBuilder: FormBuilder
  ) {}

  formGroup: FormGroup | undefined;
  @ViewChild('accValidate', { static: false }) accValidateInput: ElementRef;
  @ViewChild('userIDValidate', { static: false })
  userIDValidateInput: ElementRef;
  @ViewChild('pwValidate', { static: false }) pwValidateInput: ElementRef;

  showAcc = true;
  acc = '';
  showUserID = true;
  userID = '';
  showPw = true;
  pw = '';

  keepAcc = false;

  //url setting
  setUserIDUrl = 'https://test.com/setUserID';
  forgetUrl = 'https://test.com/forget';
  setpwUrl = 'https://test.com/setPW';
  registerUrl = environment.registerUrl;

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      acc: ['', Validators.required],
      userID: [
        '',
        [Validators.required, Validators.pattern(/^[a-zA-Z\d]{6,20}$/)],
      ],
      pw: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\d]{8,12}$/)]],
    });

    //keepAcc
    const keepAcc = this.cookieService.get('keepAcc');
    if (keepAcc) {
      this.keepAcc = true;
      this.acc = atob(keepAcc);
    }

    let _this = this;
    if (!this.cookieService.get('isEntered')) {
      this.openDialog(
        'firstEnter',
        '全面提升帳號的使用安全',
        '自108年5月起，登入需輸入【使用者名稱】，請立即前往設定。若您已經設定過，可關閉並略過此提醒。',
        '前往設定',
        function () {
          location.href = _this.setUserIDUrl;
        },
        '關閉'
      );
      this.cookieService.set('isEntered', 'Y');
    }
  }

  openDialog(
    type: string,
    title: string = '',
    content: string = '',
    confirmWord: string = '',
    confirmFunction: Function = function () {},
    closeWord: string = '',
    closeFunction: Function = function () {}
  ): void {
    let _this = this;
    let data = {
      title: title,
      content: content,
      confirmWord: confirmWord,
      confirmFunction: confirmFunction,
      closeWord: closeWord,
      closeFunction: closeFunction,
    };
    switch (type) {
      case 'acc_notice':
        data.content =
          '帳號為您的身分證字號。倘為外籍人士，請填寫投保時於要保書上填寫之號碼，例如：護照號碼/居留證號碼/當地的身分證字號...等';
        data.closeWord = '關閉';
        break;
      case 'userID_notice':
        data.content =
          '自108年5月起，登入安聯e網通需輸入【使用者名稱】，若您尚未設定，請至會員登入頁點選【我要設定使用者名稱】進行設定';
        data.closeWord = '關閉';
        break;
      case 'firstEnter':
        data.title = '全面提升帳號的使用安全';
        data.content =
          '自108年5月起，登入需輸入【使用者名稱】，請立即前往設定。若您已經設定過，可關閉並略過此提醒。';
        data.confirmWord = '前往設定';
        data.confirmFunction = function () {
          location.href = _this.setUserIDUrl;
        };
        break;
      default:
        data = {
          title: title,
          content: content,
          confirmWord: confirmWord,
          confirmFunction: confirmFunction,
          closeWord: closeWord,
          closeFunction: closeFunction,
        };
        break;
    }
    this.dialog.open(DialogComponent, {
      width: '70%',
      hasBackdrop: true,
      data: data,
    });
  }

  encode(input: string) {
    const firstFour = input.slice(0, 4);
    const lastThree = input.slice(-3);
    const middle = input
      .slice(4, -3)
      .split('')
      .map(() => '*')
      .join('');
    return input.length > 7 ? firstFour + middle + lastThree : input;
  }

  login() {
    //check
    if (!this.formGroup?.valid) {
      this.formGroup?.markAllAsTouched();
      this.accValidateInput.nativeElement.innerText =
        this.getErrorMessage('acc');
      this.userIDValidateInput.nativeElement.innerText =
        this.getErrorMessage('userID');
      this.pwValidateInput.nativeElement.innerText = this.getErrorMessage('pw');
      return;
    }
    const _this = this;
    const url = '';
    let request = new loginRequest();
    request.pi_Login_19_2.Acc = this.acc;
    request.pi_Login_19_2.Pw = this.pw;
    request.pi_Login_19_2.UserID = this.userID;

    // let func: any;
    // func = function () {
    //   location.href = _this.setpwUrl;
    // };
    // this.openDialog('other', 'Title', 'ReturnMessage', '密碼變更', func, '');
    // return;

    this.http.post<any>(url, request).subscribe((res: any) => {
      let but1Word = '';
      let but1func: any;
      let but2Word = '';
      let but2func: any;
      switch (res.po_Login_19_2.ReturnCode) {
        case 0:
          location.href = '';
          if (this.keepAcc) this.cookieService.set('keepAcc', btoa(this.acc));
          break;
        case -11:
          but1Word = '確認';
          but1func = function () {
            location.href = _this.setpwUrl;
          };
          break;
        case -14:
          but1Word = '密碼變更';
          but1func = function () {
            location.href = _this.setpwUrl;
          };
          but2Word = '下次再換';
          but2func = function () {
            let request = new modifyPwPreRequest();
            request.TokenMP = res.po_Login_19_2.TokenMP;
            _this.http
              .post<any>('ModifyPwPre_19', request)
              .subscribe((res_19: any) => {
                if (res_19.ReturnCode == 0) {
                } else {
                  _this.openDialog('other', '', res_19.ReturnMessage, '確認');
                }
              });
          };

          break;
        default:
          break;
      }
      this.openDialog(
        'other',
        res.po_Login_19_2.ReturnMessageTitle,
        res.po_Login_19_2.ReturnMessage,
        but1Word,
        but1func
      );
    });
  }

  getErrorMessage(key: string): string {
    const formControl = this.formGroup?.get(key);
    let lengthMessage = '輸入長度不符合規則';
    let requiredMessage = '';
    switch (key) {
      case 'acc':
        requiredMessage = '必填欄位';
        break;
      case 'userID':
        requiredMessage = '請輸入6-20碼英數符號';
        break;
      case 'pw':
        requiredMessage = '請輸入8-12碼英數符號';
        break;
    }
    let errorMessage: string;
    if (!formControl || !formControl.errors || formControl.pristine) {
      errorMessage = '';
    } else if (formControl.errors['required']) {
      errorMessage = requiredMessage;
    } else if (formControl.errors['pattern']) {
      errorMessage = lengthMessage;
    }
    return errorMessage!;
  }

  clickKeepAcc() {
    const _this = this;
    if (this.keepAcc) {
      const simpleLogin = this.cookieService.get('simpleLoginStatus');
      if (simpleLogin == 'Y') {
        this.openDialog(
          '',
          '',
          '帳號為您的身分證字號。倘為外籍人士，請填寫投保時於要保書上填寫之號碼，例如：護照號碼/居留證號碼/當地的身分證字號...等',
          '確認',
          function () {
            _this.cookieService.delete('keepAcc');
            _this.cookieService.delete('simpleLoginToken');
            _this.cookieService.set('simpleLoginStatus', 'N');
          },
          '取消',
          function () {
            _this.keepAcc = true;
          }
        );
      } else {
        this.keepAcc = false;
        this.cookieService.delete('keepAcc');
      }
    }
  }

  modifyAcc() {
    const _this = this;
    if (this.keepAcc && this.cookieService.get('simpleLoginStatus')) {
      this.openDialog(
        '',
        '',
        '提醒您，刪除「同意保留帳號」，簡易登入設定將同步失效。',
        '確認',
        function () {
          _this.keepAcc = false;
          _this.cookieService.delete('keepAcc');
          _this.cookieService.delete('simpleLoginToken');
          _this.cookieService.set('simpleLoginStatus', 'N');
        },
        '取消',
        function () {
          _this.acc = atob(_this.cookieService.get('keepAcc'));
        }
      );
    }
  }
}

class loginRequest {
  pi_CommonData = new pi_CommonData_Model();
  pi_Login_19_2 = new pi_Login_19_2_Model();
}
class pi_CommonData_Model {
  SystemID = 42;
  LoginSystemID = 42;
}
class pi_Login_19_2_Model {
  Acc: string;
  UserID: string;
  UserID2: string = '';
  Pw: string;
  DeviceID: string = '';
  PushID: string = '';
}

class modifyPwPreRequest {
  TokenMP: string;
  ModifyType = 'C';
  Pw = '';
  Pw2 = '';
}
