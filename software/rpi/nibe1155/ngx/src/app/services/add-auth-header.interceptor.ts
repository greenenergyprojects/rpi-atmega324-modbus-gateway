import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AddAuthHeaderInterceptor implements HttpInterceptor {

    constructor (private authService: AuthService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (req.headers.get('Authorization')) {
            return next.handle(req);
        }
        const token = this.authService.token;
        if (!token) { return next.handle(req); }

        // Clone the request to add the new header
        const clonedRequest = req.clone({ headers: req.headers.set('Authorization', 'Bearer ' + token) });
        // Pass the cloned request instead of the original request to the next handle
        return next.handle(clonedRequest);
    }
}
